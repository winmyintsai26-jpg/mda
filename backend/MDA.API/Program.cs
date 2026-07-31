using System.Text;
using System.Threading.RateLimiting;
using ClosedXML.Excel;
using MDA.API.AIAnalysis;
using MDA.API.Authentication.Data;
using MDA.API.Authentication.Models;
using MDA.API.Authentication.Options;
using MDA.API.Authentication.Repositories;
using MDA.API.Authentication.Services;
using MDA.API.Database;
using MDA.API.WorkbookAnalysis;
using MDA.API.WorkbookAnalysis.Columns;
using MDA.API.WorkbookAnalysis.DataTypes;
using MDA.API.WorkbookAnalysis.Pipeline;
using MDA.API.WorkbookAnalysis.Validation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Allow React to call this API
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var jwtOptions = jwtSection.Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT configuration is required.");
if (jwtOptions.SigningKey.Length < 32)
{
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("Configure Jwt:SigningKey with at least 32 characters using an environment variable or secret store.");
    }

    jwtOptions.SigningKey = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));
}
if (string.IsNullOrWhiteSpace(jwtOptions.Issuer)
    || string.IsNullOrWhiteSpace(jwtOptions.Audience)
    || jwtOptions.AccessTokenMinutes is <= 0 or > 60
    || jwtOptions.RefreshTokenDays is <= 0 or > 90)
{
    throw new InvalidOperationException("JWT issuer, audience, and token lifetimes must be configured correctly.");
}
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(jwtOptions));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});
builder.Services.AddDbContext<MdaDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("MdaMetadata")));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailVerificationTokenService, EmailVerificationTokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpClient<IEmailSender, ResendEmailSender>(client =>
{
    client.BaseAddress = new Uri("https://api.resend.com/");
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddSingleton<TimeProvider>(TimeProvider.System);

var emailSection = builder.Configuration.GetSection(EmailOptions.SectionName);
builder.Services.AddOptions<EmailOptions>()
    .Bind(emailSection)
    .Validate(options => string.Equals(options.Provider, "Resend", StringComparison.OrdinalIgnoreCase), "Email provider must be Resend.")
    .Validate(options => !string.IsNullOrWhiteSpace(options.From), "Email sender is required.")
    .Validate(options => Uri.TryCreate(options.FrontendBaseUrl, UriKind.Absolute, out _), "Email frontend base URL must be absolute.")
    .Validate(options => options.VerificationTokenHours == 24, "Email verification tokens must expire after 24 hours.")
    .ValidateOnStart();

builder.Services.AddScoped<MySqlConnectionService>();
builder.Services.AddScoped<MySqlSchemaService>();
builder.Services.AddScoped<MySqlImportService>();
builder.Services.Configure<LocalAiOptions>(builder.Configuration.GetSection("AiAnalysis:Local"));
builder.Services.AddHttpClient<IAiExplanationProvider, OllamaAiExplanationProvider>();

builder.Services.AddScoped<IWorkbookLoader, DefaultWorkbookLoader>();
builder.Services.AddScoped<WorksheetScanner>();
builder.Services.AddScoped<IRegionDetector, DefaultRegionDetector>();
builder.Services.AddScoped<IHeaderDetector, DefaultHeaderDetector>();
builder.Services.AddScoped<ITableClassifier, DefaultTableClassifier>();
builder.Services.AddScoped<ITableValidator, TableValidator>();
builder.Services.AddScoped<IColumnDetector, DefaultColumnDetector>();
builder.Services.AddScoped<IDataTypeDetector, DefaultDataTypeDetector>();
builder.Services.AddScoped<WorkbookAnalysisOptions>();
builder.Services.AddScoped<IWorkbookAnalysisStage, WorkbookScannerStage>();
builder.Services.AddScoped<IWorkbookAnalysisStage, RegionDetectionStage>();
builder.Services.AddScoped<IWorkbookAnalysisStage, HeaderDetectionStage>();
builder.Services.AddScoped<IWorkbookAnalysisStage, TableClassificationStage>();
builder.Services.AddScoped<IWorkbookAnalysisStage, TableValidationStage>();
builder.Services.AddScoped<IWorkbookAnalysisStage, ColumnDetectionStage>();
builder.Services.AddScoped<IWorkbookAnalysisStage, DataTypeDetectionStage>();
builder.Services.AddScoped<IWorkbookAnalysisStage, WorksheetProjectionStage>();
builder.Services.AddScoped<WorkbookAnalyzer>();

var app = builder.Build();

Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "Data"));
await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MdaDbContext>();
    await dbContext.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.MapGet("/", () => "MDA API is Running!");

// Upload Excel
app.MapPost("/upload", async (IFormFile file) =>
{
    if (file == null || file.Length == 0)
    {
        return Results.BadRequest("No file uploaded.");
    }

    using var stream = new MemoryStream();
    await file.CopyToAsync(stream);

    stream.Position = 0;

    using var workbook = new XLWorkbook(stream);

    var worksheet = workbook.Worksheet(1);

    var rows = new List<List<string>>();

    foreach (var row in worksheet.RowsUsed())
    {
        var values = row.Cells()
                        .Select(c => c.GetValue<string>())
                        .ToList();

        rows.Add(values);
    }

    return Results.Ok(rows);
})
.DisableAntiforgery()
.RequireAuthorization();

app.MapPost("/analyze", async (IFormFile file, IWorkbookLoader loader, WorkbookAnalyzer analyzer) =>
{
    if (file == null || file.Length == 0)
    {
        return Results.BadRequest("No file uploaded.");
    }

    using var stream = new MemoryStream();
    await file.CopyToAsync(stream);
    stream.Position = 0;

    var loadResult = await loader.LoadAsync(stream, file.FileName);
    if (!loadResult.Success || loadResult.Workbook == null)
    {
        return Results.BadRequest(loadResult.ErrorMessage);
    }

    var analysisResult = analyzer.Analyze(loadResult.Workbook);

    return Results.Ok(analysisResult);
})

.DisableAntiforgery()
.RequireAuthorization();

app.MapPost("/database/mysql/test-connection", async (MySqlConnectionRequest request, MySqlConnectionService connectionService, CancellationToken cancellationToken) =>
{
    var result = await connectionService.TestConnectionAsync(request, cancellationToken);
    return result.Success ? Results.Ok(result) : Results.BadRequest(result);
}).RequireAuthorization();

app.MapPost("/database/mysql/databases", async (MySqlConnectionRequest request, MySqlSchemaService schemaService, CancellationToken cancellationToken) =>
{
    try
    {
        var databases = await schemaService.ListDatabasesAsync(request, cancellationToken);
        return Results.Ok(databases);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
}).RequireAuthorization();

app.MapPost("/database/mysql/tables", async (MySqlDatabaseRequest request, MySqlSchemaService schemaService, CancellationToken cancellationToken) =>
{
    try
    {
        var tables = await schemaService.ListTablesAsync(request, cancellationToken);
        return Results.Ok(tables);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
}).RequireAuthorization();

app.MapPost("/database/mysql/schema", async (MySqlTableRequest request, MySqlSchemaService schemaService, CancellationToken cancellationToken) =>
{
    try
    {
        var columns = await schemaService.GetTableSchemaAsync(request, cancellationToken);
        return Results.Ok(columns);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
}).RequireAuthorization();

app.MapPost("/database/mysql/import", async (MySqlImportRequest request, MySqlImportService importService, CancellationToken cancellationToken) =>
{
    try
    {
        var result = await importService.ImportAsync(request, cancellationToken);
        return Results.Ok(result);
    }
    catch (MySqlImportValidationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"[MySQL Import] Unexpected error: {ex.Message}");
        return Results.BadRequest(new { message = "Import failed due to an unexpected server error. Verify table access and source data, then try again." });
    }
}).RequireAuthorization();

app.MapPost("/ai/analysis/explain", async (AiAnalysisRequest request, IAiExplanationProvider provider, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Question))
    {
        return Results.BadRequest(new { message = "A question is required." });
    }

    if (request.Question.Length > 2_000)
    {
        return Results.BadRequest(new { message = "The question is too long." });
    }

    if (request.Evidence is null
        || request.Evidence.Facts is null
        || !ApprovedAiAnalysisOperations.All.Contains(request.Evidence.Operation)
        || request.Evidence.Facts.Count == 0
        || request.Evidence.Facts.Count > 20)
    {
        return Results.BadRequest(new { message = "Verified MDA evidence is required." });
    }

    try
    {
        var result = await provider.ExplainAsync(request, cancellationToken);
        return Results.Ok(result);
    }
    catch (AiProviderUnavailableException exception)
    {
        return Results.Json(new { message = exception.Message }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
}).RequireAuthorization();

app.Run();

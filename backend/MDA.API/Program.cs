using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis;
using MDA.API.WorkbookAnalysis.Columns;
using MDA.API.WorkbookAnalysis.DataTypes;
using MDA.API.WorkbookAnalysis.Validation;

var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddOpenApi();

// Allow React to call this API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.UseHttpsRedirection();

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
.DisableAntiforgery();

app.MapPost("/analyze", async (IFormFile file) =>
{
    if (file == null || file.Length == 0)
    {
        return Results.BadRequest("No file uploaded.");
    }

    using var stream = new MemoryStream();
    await file.CopyToAsync(stream);
    stream.Position = 0;

    var loader = new DefaultWorkbookLoader();
    var loadResult = await loader.LoadAsync(stream, file.FileName);
    if (!loadResult.Success || loadResult.Workbook == null)
    {
        return Results.BadRequest(loadResult.ErrorMessage);
    }

    var analyzer = new WorkbookAnalyzer(
        new WorksheetScanner(),
        new DefaultRegionDetector(),
        new DefaultHeaderDetector(),
        new DefaultTableClassifier(),
        new TableValidator(),
        new DefaultColumnDetector(),
        new DefaultDataTypeDetector(),
        new WorkbookAnalysisOptions());

    var analysisResult = analyzer.Analyze(loadResult.Workbook);

    return Results.Ok(analysisResult);
})

.DisableAntiforgery();
app.Run();
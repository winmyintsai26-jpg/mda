using System.Net;
using MDA.API.Authentication.Models;
using MDA.API.Authentication.Options;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace MDA.API.Authentication.Services;

public sealed class EmailService(IEmailSender emailSender, IOptions<EmailOptions> options) : IEmailService
{
    private const string TemplateResource = "MDA.API.Authentication.Templates.VerifyEmail.html";

    public async Task SendVerificationEmailAsync(User user, string token, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var verifyUrl = QueryHelpers.AddQueryString(
            $"{settings.FrontendBaseUrl.TrimEnd('/')}/verify-email",
            "token",
            token);
        var template = await ReadTemplateAsync(cancellationToken);
        var html = template
            .Replace("{{DISPLAY_NAME}}", WebUtility.HtmlEncode(user.DisplayName), StringComparison.Ordinal)
            .Replace("{{VERIFY_URL}}", WebUtility.HtmlEncode(verifyUrl), StringComparison.Ordinal);

        await emailSender.SendAsync(
            new EmailMessage(user.Email, "Verify your MDA email", html),
            cancellationToken);
    }

    private static async Task<string> ReadTemplateAsync(CancellationToken cancellationToken)
    {
        var assembly = typeof(EmailService).Assembly;
        await using var stream = assembly.GetManifestResourceStream(TemplateResource)
            ?? throw new InvalidOperationException("The verification email template is missing.");
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync(cancellationToken);
    }
}

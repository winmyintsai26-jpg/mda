namespace MDA.API.Authentication.Options;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string Provider { get; init; } = "Resend";
    public string ApiKey { get; init; } = string.Empty;
    public string From { get; init; } = string.Empty;
    public string FrontendBaseUrl { get; init; } = string.Empty;
    public int VerificationTokenHours { get; init; } = 24;
}

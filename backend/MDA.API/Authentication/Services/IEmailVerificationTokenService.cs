namespace MDA.API.Authentication.Services;

public interface IEmailVerificationTokenService
{
    GeneratedVerificationToken CreateToken();
    string HashToken(string token);
}

public sealed record GeneratedVerificationToken(string Token, string TokenHash);

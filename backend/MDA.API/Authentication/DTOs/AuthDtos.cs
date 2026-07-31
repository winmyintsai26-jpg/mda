using System.ComponentModel.DataAnnotations;

namespace MDA.API.Authentication.DTOs;

public sealed class RegisterRequest
{
    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(2), MaxLength(100)]
    public string DisplayName { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one letter and one number.")]
    public string Password { get; init; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(128)]
    public string Password { get; init; } = string.Empty;
}

public sealed class ResendVerificationRequest
{
    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; init; } = string.Empty;
}

public sealed record RegistrationResponse(string Email, string Message);

public sealed record VerificationStatusResponse(bool EmailVerified);

public sealed record AuthenticatedUserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    bool EmailVerified);

public sealed record LoginResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    AuthenticatedUserResponse User);

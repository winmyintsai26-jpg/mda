using MDA.API.Authentication.DTOs;

namespace MDA.API.Authentication.Services;

public interface IAuthService
{
    Task<RegistrationResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    Task<AuthenticationResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken);

    Task<AuthenticationResult> RefreshAsync(string refreshToken, CancellationToken cancellationToken);

    Task LogoutAsync(string refreshToken, CancellationToken cancellationToken);

    Task<AuthenticatedUserResponse?> GetUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<EmailVerificationResult> VerifyEmailAsync(string token, CancellationToken cancellationToken);

    Task ResendVerificationAsync(string email, CancellationToken cancellationToken);
}

public enum AuthenticationFailure
{
    None,
    EmailAlreadyExists,
    InvalidCredentials,
    EmailVerificationRequired,
    InvalidRefreshToken
}

public enum RegistrationFailure
{
    None,
    EmailAlreadyExists,
    EmailDeliveryFailed
}

public sealed record RegistrationResult(RegistrationResponse? Response, RegistrationFailure Failure)
{
    public bool Succeeded => Failure == RegistrationFailure.None && Response is not null;
    public static RegistrationResult Failed(RegistrationFailure failure, RegistrationResponse? response = null) => new(response, failure);
}

public enum EmailVerificationResult
{
    Success,
    Invalid,
    Expired,
    Used
}

public sealed record AuthenticationResult(
    LoginResponse? Response,
    string? RefreshToken,
    DateTimeOffset? RefreshTokenExpiresAt,
    AuthenticationFailure Failure)
{
    public bool Succeeded => Failure == AuthenticationFailure.None && Response is not null;

    public static AuthenticationResult Failed(AuthenticationFailure failure) => new(null, null, null, failure);
}

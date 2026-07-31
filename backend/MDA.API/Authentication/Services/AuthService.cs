using MDA.API.Authentication.DTOs;
using MDA.API.Authentication.Models;
using MDA.API.Authentication.Options;
using MDA.API.Authentication.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MDA.API.Authentication.Services;

public sealed class AuthService(
    IUserRepository users,
    IPasswordHasher<User> passwordHasher,
    IJwtService jwtService,
    IEmailVerificationTokenService verificationTokens,
    IEmailService emailService,
    IOptions<EmailOptions> emailOptions,
    ILogger<AuthService> logger,
    TimeProvider timeProvider) : IAuthService
{
    public async Task<RegistrationResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await users.GetByEmailAsync(email, cancellationToken) is not null)
        {
            return RegistrationResult.Failed(RegistrationFailure.EmailAlreadyExists);
        }

        var now = timeProvider.GetUtcNow();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            NormalizedEmail = email,
            DisplayName = request.DisplayName.Trim(),
            EmailVerified = false,
            CreatedAt = now,
            UpdatedAt = now
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        await users.AddUserAsync(user, cancellationToken);
        var generatedToken = verificationTokens.CreateToken();
        await users.AddEmailVerificationTokenAsync(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = generatedToken.TokenHash,
            ExpiresAt = now.AddHours(emailOptions.Value.VerificationTokenHours),
            CreatedAt = now
        }, cancellationToken);

        try
        {
            await users.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return RegistrationResult.Failed(RegistrationFailure.EmailAlreadyExists);
        }

        var response = new RegistrationResponse(
            user.Email,
            "Account created. Check your email to verify your address before signing in.");
        try
        {
            await emailService.SendVerificationEmailAsync(user, generatedToken.Token, cancellationToken);
            return new RegistrationResult(response, RegistrationFailure.None);
        }
        catch (EmailDeliveryException exception)
        {
            logger.LogError(exception, "Verification email delivery failed for newly registered user {UserId}.", user.Id);
            return RegistrationResult.Failed(RegistrationFailure.EmailDeliveryFailed, response);
        }
    }

    public async Task<AuthenticationResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await users.GetByEmailAsync(email, cancellationToken);
        if (user is null)
        {
            return AuthenticationResult.Failed(AuthenticationFailure.InvalidCredentials);
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return AuthenticationResult.Failed(AuthenticationFailure.InvalidCredentials);
        }

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
            user.UpdatedAt = timeProvider.GetUtcNow();
        }

        if (!user.EmailVerified)
        {
            await users.SaveChangesAsync(cancellationToken);
            return AuthenticationResult.Failed(AuthenticationFailure.EmailVerificationRequired);
        }

        var session = await CreateSessionAsync(user, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<AuthenticationResult> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var storedToken = await users.GetRefreshTokenAsync(jwtService.HashRefreshToken(refreshToken), cancellationToken);
        var now = timeProvider.GetUtcNow();
        if (storedToken is null || !storedToken.IsActive(now) || !storedToken.User.EmailVerified)
        {
            return AuthenticationResult.Failed(AuthenticationFailure.InvalidRefreshToken);
        }

        storedToken.RevokedAt = now;
        var session = await CreateSessionAsync(storedToken.User, cancellationToken);
        try
        {
            await users.SaveChangesAsync(cancellationToken);
            return session;
        }
        catch (DbUpdateConcurrencyException)
        {
            return AuthenticationResult.Failed(AuthenticationFailure.InvalidRefreshToken);
        }
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var storedToken = await users.GetRefreshTokenAsync(jwtService.HashRefreshToken(refreshToken), cancellationToken);
        if (storedToken is null || storedToken.RevokedAt is not null)
        {
            return;
        }

        storedToken.RevokedAt = timeProvider.GetUtcNow();
        try
        {
            await users.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another request already revoked this token. Logout remains idempotent.
        }
    }

    public async Task<AuthenticatedUserResponse?> GetUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken);
        return user is null ? null : ToResponse(user);
    }

    public async Task<EmailVerificationResult> VerifyEmailAsync(string token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 200)
        {
            return EmailVerificationResult.Invalid;
        }

        var storedToken = await users.GetEmailVerificationTokenAsync(
            verificationTokens.HashToken(token),
            cancellationToken);
        if (storedToken is null) return EmailVerificationResult.Invalid;
        if (storedToken.UsedAt is not null) return EmailVerificationResult.Used;

        var now = timeProvider.GetUtcNow();
        if (storedToken.ExpiresAt <= now) return EmailVerificationResult.Expired;

        storedToken.UsedAt = now;
        storedToken.User.EmailVerified = true;
        storedToken.User.UpdatedAt = now;
        try
        {
            await users.SaveChangesAsync(cancellationToken);
            return EmailVerificationResult.Success;
        }
        catch (DbUpdateConcurrencyException)
        {
            return EmailVerificationResult.Used;
        }
    }

    public async Task ResendVerificationAsync(string email, CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await users.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null || user.EmailVerified) return;

        var now = timeProvider.GetUtcNow();
        var activeTokens = await users.GetUsableEmailVerificationTokensAsync(user.Id, now, cancellationToken);
        foreach (var activeToken in activeTokens) activeToken.UsedAt = now;

        var generatedToken = verificationTokens.CreateToken();
        await users.AddEmailVerificationTokenAsync(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = generatedToken.TokenHash,
            ExpiresAt = now.AddHours(emailOptions.Value.VerificationTokenHours),
            CreatedAt = now
        }, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);

        try
        {
            await emailService.SendVerificationEmailAsync(user, generatedToken.Token, cancellationToken);
        }
        catch (EmailDeliveryException exception)
        {
            // Resend is deliberately non-enumerating, so provider failures are logged but never reflected differently to callers.
            logger.LogError(exception, "Verification email resend failed for user {UserId}.", user.Id);
        }
    }

    private async Task<AuthenticationResult> CreateSessionAsync(User user, CancellationToken cancellationToken)
    {
        var accessToken = jwtService.CreateAccessToken(user);
        var refreshToken = jwtService.CreateRefreshToken();
        await users.AddRefreshTokenAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshToken.TokenHash,
            ExpiresAt = refreshToken.ExpiresAt,
            CreatedAt = timeProvider.GetUtcNow()
        }, cancellationToken);

        return new AuthenticationResult(
            new LoginResponse(accessToken.Token, accessToken.ExpiresAt, ToResponse(user)),
            refreshToken.Token,
            refreshToken.ExpiresAt,
            AuthenticationFailure.None);
    }

    private static AuthenticatedUserResponse ToResponse(User user) =>
        new(user.Id, user.Email, user.DisplayName, user.EmailVerified);
}

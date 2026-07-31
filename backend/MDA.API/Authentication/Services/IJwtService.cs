using MDA.API.Authentication.Models;

namespace MDA.API.Authentication.Services;

public interface IJwtService
{
    AccessTokenResult CreateAccessToken(User user);

    RefreshTokenResult CreateRefreshToken();

    string HashRefreshToken(string token);
}

public sealed record AccessTokenResult(string Token, DateTimeOffset ExpiresAt);

public sealed record RefreshTokenResult(string Token, string TokenHash, DateTimeOffset ExpiresAt);

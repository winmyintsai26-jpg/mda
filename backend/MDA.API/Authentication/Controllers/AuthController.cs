using System.IdentityModel.Tokens.Jwt;
using MDA.API.Authentication.DTOs;
using MDA.API.Authentication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MDA.API.Authentication.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    private const string RefreshTokenCookie = "mda.refresh_token";

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);
        if (result.Failure == RegistrationFailure.EmailAlreadyExists)
        {
            return Conflict(new { message = "An account with this email already exists." });
        }
        if (result.Failure == RegistrationFailure.EmailDeliveryFailed)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Your account was created, but the verification email could not be sent. Please use resend verification.",
                email = result.Response?.Email,
                accountCreated = true
            });
        }

        return Accepted(result.Response);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);
        if (!result.Succeeded)
        {
            if (result.Failure == AuthenticationFailure.EmailVerificationRequired)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    code = "email_verification_required",
                    message = "Verify your email before signing in. You can request a new verification email."
                });
            }
            return Unauthorized(new { message = "Email or password is incorrect." });
        }

        SetRefreshTokenCookie(result);
        return Ok(result.Response);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(RefreshTokenCookie, out var refreshToken)
            || string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new { message = "No active session was found." });
        }

        var result = await authService.RefreshAsync(refreshToken, cancellationToken);
        if (!result.Succeeded)
        {
            DeleteRefreshTokenCookie();
            return Unauthorized(new { message = "The session has expired. Please log in again." });
        }

        SetRefreshTokenCookie(result);
        return Ok(result.Response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        if (Request.Cookies.TryGetValue(RefreshTokenCookie, out var refreshToken)
            && !string.IsNullOrWhiteSpace(refreshToken))
        {
            await authService.LogoutAsync(refreshToken, cancellationToken);
        }

        DeleteRefreshTokenCookie();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var subject = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (!Guid.TryParse(subject, out var userId))
        {
            return Unauthorized();
        }

        var user = await authService.GetUserAsync(userId, cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    [HttpPost("resend-verification")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResendVerification(ResendVerificationRequest request, CancellationToken cancellationToken)
    {
        await authService.ResendVerificationAsync(request.Email, cancellationToken);
        return Accepted(new { message = "If an unverified account exists for that email, a new verification email has been sent." });
    }

    [HttpGet("verify-email")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token, CancellationToken cancellationToken)
    {
        var result = await authService.VerifyEmailAsync(token, cancellationToken);
        return result switch
        {
            EmailVerificationResult.Success => Ok(new { message = "Email verified successfully. You can now sign in." }),
            EmailVerificationResult.Expired => StatusCode(StatusCodes.Status410Gone, new { code = "expired_token", message = "This verification link has expired." }),
            EmailVerificationResult.Used => Conflict(new { code = "used_token", message = "This verification link has already been used." }),
            _ => BadRequest(new { code = "invalid_token", message = "This verification link is invalid." })
        };
    }

    [Authorize]
    [HttpGet("verification-status")]
    public async Task<IActionResult> VerificationStatus(CancellationToken cancellationToken)
    {
        var subject = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (!Guid.TryParse(subject, out var userId)) return Unauthorized();

        var user = await authService.GetUserAsync(userId, cancellationToken);
        return user is null ? Unauthorized() : Ok(new VerificationStatusResponse(user.EmailVerified));
    }

    private void SetRefreshTokenCookie(AuthenticationResult result)
    {
        Response.Cookies.Append(RefreshTokenCookie, result.RefreshToken!, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/auth",
            Expires = result.RefreshTokenExpiresAt,
            IsEssential = true
        });
    }

    private void DeleteRefreshTokenCookie() => Response.Cookies.Delete(RefreshTokenCookie, new CookieOptions
    {
        HttpOnly = true,
        Secure = Request.IsHttps,
        SameSite = SameSiteMode.Strict,
        Path = "/auth"
    });
}

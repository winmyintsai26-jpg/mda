using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;

namespace MDA.API.Authentication.Services;

public sealed class EmailVerificationTokenService : IEmailVerificationTokenService
{
    public GeneratedVerificationToken CreateToken()
    {
        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));
        return new GeneratedVerificationToken(token, HashToken(token));
    }

    public string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

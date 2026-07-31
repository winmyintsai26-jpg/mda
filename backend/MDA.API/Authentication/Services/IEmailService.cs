using MDA.API.Authentication.Models;

namespace MDA.API.Authentication.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(User user, string token, CancellationToken cancellationToken);
}

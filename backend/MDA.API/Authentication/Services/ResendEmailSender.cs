using System.Net.Http.Headers;
using System.Net.Http.Json;
using MDA.API.Authentication.Options;
using Microsoft.Extensions.Options;

namespace MDA.API.Authentication.Services;

public sealed class ResendEmailSender(HttpClient httpClient, IOptions<EmailOptions> options) : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (!string.Equals(settings.Provider, "Resend", StringComparison.OrdinalIgnoreCase))
        {
            throw new EmailDeliveryException($"Email provider '{settings.Provider}' is not supported.");
        }
        if (string.IsNullOrWhiteSpace(settings.ApiKey))
        {
            throw new EmailDeliveryException("Email delivery is not configured.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "emails")
        {
            Content = JsonContent.Create(new
            {
                from = settings.From,
                to = new[] { message.To },
                subject = message.Subject,
                html = message.Html
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new EmailDeliveryException($"The email provider returned HTTP {(int)response.StatusCode}.");
            }
        }
        catch (EmailDeliveryException)
        {
            throw;
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            throw new EmailDeliveryException("The verification email could not be sent.", exception);
        }
    }
}

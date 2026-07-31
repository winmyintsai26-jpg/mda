namespace MDA.API.Authentication.Services;

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken);
}

public sealed record EmailMessage(string To, string Subject, string Html);

public sealed class EmailDeliveryException(string message, Exception? innerException = null)
    : Exception(message, innerException);

namespace MDA.API.AIAnalysis;

public sealed class AiProviderUnavailableException(string message, Exception? innerException = null)
    : Exception(message, innerException);

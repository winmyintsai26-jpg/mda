namespace MDA.API.AIAnalysis;

public sealed class LocalAiOptions
{
    public string BaseUrl { get; init; } = "http://localhost:11434";

    public string Model { get; init; } = "llama3.2:3b";

    public int TimeoutSeconds { get; init; } = 90;
}

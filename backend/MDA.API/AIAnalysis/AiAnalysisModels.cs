namespace MDA.API.AIAnalysis;

public sealed class AiAnalysisRequest
{
    public string Question { get; init; } = string.Empty;

    public List<AiConversationMessage> Conversation { get; init; } = [];

    public AiEvidence Evidence { get; init; } = new();
}

public sealed class AiConversationMessage
{
    public string Role { get; init; } = string.Empty;

    public string Content { get; init; } = string.Empty;
}

public sealed class AiEvidence
{
    public string Operation { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;

    public string Summary { get; init; } = string.Empty;

    public List<AiEvidenceFact> Facts { get; init; } = [];

    public AiEvidenceSource Source { get; init; } = new();
}

public sealed class AiEvidenceFact
{
    public string Label { get; init; } = string.Empty;

    public string Value { get; init; } = string.Empty;
}

public sealed class AiEvidenceSource
{
    public string Workbook { get; init; } = string.Empty;

    public string Worksheet { get; init; } = string.Empty;

    public List<int> RowIndices { get; init; } = [];
}

public sealed record AiAnalysisResponse(string Content, string Provider, bool UsedVerifiedEvidence);

public static class ApprovedAiAnalysisOperations
{
    public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
    {
        "overview",
        "trend",
        "comparison",
        "category",
        "quality",
        "anomaly",
        "relationship"
    };
}

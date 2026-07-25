namespace MDA.API.AIAnalysis;

public interface IAiExplanationProvider
{
    Task<AiAnalysisResponse> ExplainAsync(AiAnalysisRequest request, CancellationToken cancellationToken);
}

namespace MDA.API.WorkbookAnalysis.Models;

public class HeaderDetectionResult
{
    public HeaderCandidate WinningHeader { get; set; } = new();

    public List<HeaderCandidate> CandidateHeaders { get; set; } = new();
}

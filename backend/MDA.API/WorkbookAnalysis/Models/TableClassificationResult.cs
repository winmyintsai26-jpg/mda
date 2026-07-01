namespace MDA.API.WorkbookAnalysis.Models;

public class TableClassificationResult
{
    public TableClassificationCandidate WinningClassification { get; set; } = new();

    public List<TableClassificationCandidate> ClassificationCandidates { get; set; } = new();
}

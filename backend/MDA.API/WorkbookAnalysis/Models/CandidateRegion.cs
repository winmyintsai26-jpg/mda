namespace MDA.API.WorkbookAnalysis.Models;

public class CandidateRegion
{
    public int Id { get; set; }

    public int StartRow { get; set; }

    public int EndRow { get; set; }

    public int StartColumn { get; set; }

    public int EndColumn { get; set; }

    public List<List<string>> Rows { get; set; } = new();

    public HeaderDetectionResult HeaderDetectionResult { get; set; } = new();

    public TableClassificationResult TableClassification { get; set; } = new();
}
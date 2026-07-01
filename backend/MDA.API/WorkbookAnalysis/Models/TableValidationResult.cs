namespace MDA.API.WorkbookAnalysis.Models;

public class TableValidationResult
{
    public bool IsValid { get; set; }

    public int Confidence { get; set; }

    public List<string> Issues { get; set; } = new();

    public List<string> Warnings { get; set; } = new();
}

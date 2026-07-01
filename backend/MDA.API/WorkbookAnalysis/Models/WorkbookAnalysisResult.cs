namespace MDA.API.WorkbookAnalysis.Models;

public class WorkbookAnalysisResult
{
    public string FileName { get; set; } = "";

    public List<WorksheetAnalysis> Worksheets { get; set; } = new();
}
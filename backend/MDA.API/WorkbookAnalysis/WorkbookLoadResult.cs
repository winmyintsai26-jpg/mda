namespace MDA.API.WorkbookAnalysis;

public class WorkbookLoadResult
{
    public bool Success { get; set; }

    public IWorkbook? Workbook { get; set; }

    public string ErrorMessage { get; set; } = string.Empty;

    public string OriginalFileName { get; set; } = string.Empty;

    public string DetectedFormat { get; set; } = string.Empty;
}

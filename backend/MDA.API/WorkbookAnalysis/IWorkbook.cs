namespace MDA.API.WorkbookAnalysis;

public interface IWorkbook
{
    string OriginalFileName { get; }

    string DetectedFormat { get; }

    IReadOnlyList<IWorkbookSheet> Worksheets { get; }
}

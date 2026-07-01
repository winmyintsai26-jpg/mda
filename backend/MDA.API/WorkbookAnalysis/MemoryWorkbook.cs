namespace MDA.API.WorkbookAnalysis;

internal class MemoryWorkbook : IWorkbook
{
    public MemoryWorkbook(string originalFileName, string detectedFormat, IReadOnlyList<IWorkbookSheet> worksheets)
    {
        OriginalFileName = originalFileName;
        DetectedFormat = detectedFormat;
        Worksheets = worksheets;
    }

    public string OriginalFileName { get; }

    public string DetectedFormat { get; }

    public IReadOnlyList<IWorkbookSheet> Worksheets { get; }
}

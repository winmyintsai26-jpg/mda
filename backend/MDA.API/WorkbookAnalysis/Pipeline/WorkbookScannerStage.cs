namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class WorkbookScannerStage : IWorkbookAnalysisStage
{
    private readonly WorksheetScanner _scanner;

    public WorkbookScannerStage(WorksheetScanner scanner)
    {
        _scanner = scanner;
    }

    public void Execute(WorkbookContext context)
    {
        context.Worksheets.Clear();

        foreach (var worksheet in context.ClosedWorkbook.Worksheets)
        {
            var scanResult = _scanner.Scan(worksheet);
            context.Worksheets.Add(new WorksheetContext(worksheet, scanResult));
        }
    }
}

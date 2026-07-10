namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class HeaderDetectionStage : IWorkbookAnalysisStage
{
    private readonly IHeaderDetector _headerDetector;

    public HeaderDetectionStage(IHeaderDetector headerDetector)
    {
        _headerDetector = headerDetector;
    }

    public void Execute(WorkbookContext context)
    {
        foreach (var worksheetContext in context.Worksheets)
        {
            foreach (var region in worksheetContext.Regions)
            {
                region.Rows = RegionRows.Extract(worksheetContext.ScanResult.CellValues, region);
                region.HeaderDetectionResult = _headerDetector.Detect(worksheetContext.ScanResult, region);
                RegionRows.RemoveRepeatedHeaderRows(region);
            }
        }
    }
}

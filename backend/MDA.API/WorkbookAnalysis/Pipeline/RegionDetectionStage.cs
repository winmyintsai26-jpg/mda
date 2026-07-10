namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class RegionDetectionStage : IWorkbookAnalysisStage
{
    private readonly IRegionDetector _regionDetector;

    public RegionDetectionStage(IRegionDetector regionDetector)
    {
        _regionDetector = regionDetector;
    }

    public void Execute(WorkbookContext context)
    {
        foreach (var worksheetContext in context.Worksheets)
        {
            var regions = _regionDetector.Detect(worksheetContext.ScanResult, context.Options);

            worksheetContext.Regions.Clear();
            for (var index = 0; index < regions.Count; index++)
            {
                regions[index].Id = index + 1;
                worksheetContext.Regions.Add(regions[index]);
            }
        }
    }
}

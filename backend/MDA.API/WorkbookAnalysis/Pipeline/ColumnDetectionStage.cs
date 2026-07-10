using MDA.API.WorkbookAnalysis.Columns;

namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class ColumnDetectionStage : IWorkbookAnalysisStage
{
    private readonly IColumnDetector _columnDetector;

    public ColumnDetectionStage(IColumnDetector columnDetector)
    {
        _columnDetector = columnDetector;
    }

    public void Execute(WorkbookContext context)
    {
        foreach (var worksheetContext in context.Worksheets)
        {
            foreach (var region in worksheetContext.Regions)
            {
                region.Columns = _columnDetector.DetectColumns(region);
            }
        }
    }
}

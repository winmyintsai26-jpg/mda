namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class TableClassificationStage : IWorkbookAnalysisStage
{
    private readonly ITableClassifier _tableClassifier;

    public TableClassificationStage(ITableClassifier tableClassifier)
    {
        _tableClassifier = tableClassifier;
    }

    public void Execute(WorkbookContext context)
    {
        foreach (var worksheetContext in context.Worksheets)
        {
            foreach (var region in worksheetContext.Regions)
            {
                region.TableClassification = _tableClassifier.Classify(
                    worksheetContext.ScanResult,
                    region,
                    region.HeaderDetectionResult);
            }
        }
    }
}

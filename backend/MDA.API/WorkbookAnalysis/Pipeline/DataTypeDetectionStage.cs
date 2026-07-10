using MDA.API.WorkbookAnalysis.DataTypes;

namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class DataTypeDetectionStage : IWorkbookAnalysisStage
{
    private readonly IDataTypeDetector _dataTypeDetector;

    public DataTypeDetectionStage(IDataTypeDetector dataTypeDetector)
    {
        _dataTypeDetector = dataTypeDetector;
    }

    public void Execute(WorkbookContext context)
    {
        foreach (var worksheetContext in context.Worksheets)
        {
            foreach (var region in worksheetContext.Regions)
            {
                region.Columns = _dataTypeDetector.Detect(region.Columns);
            }
        }
    }
}

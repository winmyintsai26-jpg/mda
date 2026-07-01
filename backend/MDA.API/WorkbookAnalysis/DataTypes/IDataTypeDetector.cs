using MDA.API.WorkbookAnalysis.Columns;

namespace MDA.API.WorkbookAnalysis.DataTypes;

public interface IDataTypeDetector
{
    List<DetectedColumn> Detect(List<DetectedColumn> columns);
}

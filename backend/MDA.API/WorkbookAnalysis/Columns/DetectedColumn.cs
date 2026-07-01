using MDA.API.WorkbookAnalysis.DataTypes;

namespace MDA.API.WorkbookAnalysis.Columns;

public class DetectedColumn
{
    public int Index { get; set; }

    public string Header { get; set; } = string.Empty;

    public List<string> Values { get; set; } = new();

    public int NonEmptyValueCount { get; set; }

    public int EmptyValueCount { get; set; }

    public bool IsCompletelyEmpty { get; set; }

    public DetectedColumnType? Type { get; set; }
}

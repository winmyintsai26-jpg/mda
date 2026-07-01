namespace MDA.API.WorkbookAnalysis.DataTypes;

public class DetectedColumnType
{
    public string DataType { get; set; } = string.Empty;

    public int Confidence { get; set; }

    public bool IsNullable { get; set; }

    public string? DetectedFormat { get; set; }

    public int SampleCount { get; set; }
}

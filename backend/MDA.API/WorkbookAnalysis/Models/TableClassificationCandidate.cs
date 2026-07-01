namespace MDA.API.WorkbookAnalysis.Models;

public class TableClassificationCandidate
{
    public RegionType RegionType { get; set; } = RegionType.Unknown;

    public int Score { get; set; }

    public List<string> Reasons { get; set; } = new();
}

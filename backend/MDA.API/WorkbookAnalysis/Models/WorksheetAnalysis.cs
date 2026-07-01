namespace MDA.API.WorkbookAnalysis.Models;

public class WorksheetAnalysis
{
    public string SheetName { get; set; } = "";

    public int TotalRows { get; set; }

    public int TotalColumns { get; set; }

    public int OccupiedCellCount { get; set; }

    public List<CandidateRegion> CandidateRegions { get; set; } = new();
}
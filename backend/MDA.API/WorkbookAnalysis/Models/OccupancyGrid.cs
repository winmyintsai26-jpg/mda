namespace MDA.API.WorkbookAnalysis.Models;

public class OccupancyGrid
{
    public int Rows { get; set; }

    public int Columns { get; set; }

    public List<CellNode> Cells { get; set; } = new();
}
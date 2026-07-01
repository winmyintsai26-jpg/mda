namespace MDA.API.WorkbookAnalysis.Models;

public class CellNode
{
    public int Row { get; set; }

    public int Column { get; set; }

    public bool IsOccupied { get; set; }
}
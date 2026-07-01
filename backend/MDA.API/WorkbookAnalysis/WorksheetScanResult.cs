using System.Linq;

namespace MDA.API.WorkbookAnalysis;

public class WorksheetScanResult
{
    public string WorksheetName { get; init; } = string.Empty;

    public int StartRow { get; init; }

    public int EndRow { get; init; }

    public int StartColumn { get; init; }

    public int EndColumn { get; init; }

    public List<List<string>> CellValues { get; init; } = new();

    public List<List<bool>> Occupied { get; init; } = new();

    public int RowCount => EndRow >= StartRow ? EndRow - StartRow + 1 : 0;

    public int ColumnCount => EndColumn >= StartColumn ? EndColumn - StartColumn + 1 : 0;

    public int OccupiedCellCount => Occupied.Sum(row => row.Count(cell => cell));

    public List<List<string>> Rows => CellValues;
}

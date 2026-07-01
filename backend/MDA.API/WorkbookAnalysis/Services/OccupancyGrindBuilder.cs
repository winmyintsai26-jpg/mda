using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Services;

public class OccupancyGridBuilder
{
    public OccupancyGrid Build(IXLWorksheet worksheet)
    {
        OccupancyGrid grid = new();

        grid.Rows = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        grid.Columns = worksheet.LastColumnUsed()?.ColumnNumber() ?? 0;

        for (int row = 1; row <= grid.Rows; row++)
        {
            for (int col = 1; col <= grid.Columns; col++)
            {
                var cell = worksheet.Cell(row, col);

                grid.Cells.Add(new CellNode
                {
                    Row = row,
                    Column = col,
                    IsOccupied = !cell.IsEmpty()
                });
            }
        }

        return grid;
    }
}
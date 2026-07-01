using ClosedXML.Excel;

namespace MDA.API.WorkbookAnalysis;

public class WorksheetScanner
{
    public WorksheetScanResult Scan(IXLWorksheet worksheet)
    {
        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        var lastColumn = worksheet.LastColumnUsed()?.ColumnNumber() ?? 0;

        var result = new WorksheetScanResult
        {
            WorksheetName = worksheet.Name,
            StartRow = 1,
            EndRow = lastRow,
            StartColumn = 1,
            EndColumn = lastColumn
        };

        if (lastRow == 0 || lastColumn == 0)
        {
            return result;
        }

        for (var row = 1; row <= lastRow; row++)
        {
            var rowValues = new List<string>(lastColumn);
            var rowOccupied = new List<bool>(lastColumn);

            for (var column = 1; column <= lastColumn; column++)
            {
                var cell = worksheet.Cell(row, column);
                var mergedRange = cell.MergedRange();
                string value;
                bool isOccupied;

                if (mergedRange != null)
                {
                    var anchorCell = mergedRange.FirstCell();
                    value = anchorCell.GetValue<string>() ?? string.Empty;
                    isOccupied = !string.IsNullOrEmpty(value);
                }
                else
                {
                    value = cell.GetValue<string>() ?? string.Empty;
                    isOccupied = !string.IsNullOrEmpty(value);
                }

                rowValues.Add(value);
                rowOccupied.Add(isOccupied);
            }

            result.CellValues.Add(rowValues);
            result.Occupied.Add(rowOccupied);
        }

        return result;
    }
}

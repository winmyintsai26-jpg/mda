using NPOI.SS.UserModel;

namespace MDA.API.WorkbookAnalysis;

internal class NpoiWorkbookSheetWrapper : IWorkbookSheet
{
    private readonly ISheet _sheet;

    public NpoiWorkbookSheetWrapper(ISheet sheet)
    {
        _sheet = sheet;
        Name = sheet.SheetName;
        RowCount = sheet.LastRowNum + 1;
        ColumnCount = ComputeColumnCount(sheet);
    }

    public string Name { get; }

    public int RowCount { get; }

    public int ColumnCount { get; }

    public string GetCellValue(int row, int column)
    {
        var sheetRow = _sheet.GetRow(row - 1);
        if (sheetRow == null) return string.Empty;

        var cell = sheetRow.GetCell(column - 1);
        if (cell == null) return string.Empty;

        return cell.ToString() ?? string.Empty;
    }

    private static int ComputeColumnCount(ISheet sheet)
    {
        var max = 0;
        foreach (IRow row in sheet)
        {
            if (row == null) continue;
            max = Math.Max(max, row.LastCellNum);
        }

        return max;
    }
}

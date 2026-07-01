using ClosedXML.Excel;

namespace MDA.API.WorkbookAnalysis;

internal class ClosedXmlWorkbookSheetWrapper : IWorkbookSheet
{
    private readonly IXLWorksheet _worksheet;

    public ClosedXmlWorkbookSheetWrapper(IXLWorksheet worksheet)
    {
        _worksheet = worksheet;
        Name = worksheet.Name;
        RowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        ColumnCount = worksheet.LastColumnUsed()?.ColumnNumber() ?? 0;
    }

    public string Name { get; }

    public int RowCount { get; }

    public int ColumnCount { get; }

    public string GetCellValue(int row, int column)
    {
        return _worksheet.Cell(row, column).GetValue<string>() ?? string.Empty;
    }
}

using ClosedXML.Excel;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using System.Linq;

namespace MDA.API.WorkbookAnalysis;

internal class NpoiWorkbookWrapper : IWorkbook, IInternalWorkbook
{
    private readonly HSSFWorkbook _workbook;
    private XLWorkbook? _closedXmlWorkbook;

    public NpoiWorkbookWrapper(HSSFWorkbook workbook, string originalFileName, string detectedFormat)
    {
        _workbook = workbook;
        OriginalFileName = originalFileName;
        DetectedFormat = detectedFormat;
        Worksheets = Enumerable.Range(0, _workbook.NumberOfSheets)
            .Select(index => new NpoiWorkbookSheetWrapper(_workbook.GetSheetAt(index)))
            .ToList();
    }

    public string OriginalFileName { get; }

    public string DetectedFormat { get; }

    public IReadOnlyList<IWorkbookSheet> Worksheets { get; }

    public XLWorkbook GetClosedXmlWorkbook()
    {
        if (_closedXmlWorkbook != null)
        {
            return _closedXmlWorkbook;
        }

        var workbook = new XLWorkbook();

        for (var sheetIndex = 0; sheetIndex < _workbook.NumberOfSheets; sheetIndex++)
        {
            var sheet = _workbook.GetSheetAt(sheetIndex);
            var newSheet = workbook.Worksheets.Add(sheet.SheetName);

            foreach (IRow row in sheet)
            {
                if (row == null) continue;
                var rowNumber = row.RowNum + 1;
                foreach (var cell in row.Cells)
                {
                    var columnNumber = cell.ColumnIndex + 1;
                    newSheet.Cell(rowNumber, columnNumber).Value = cell.ToString() ?? string.Empty;
                }
            }
        }

        _closedXmlWorkbook = workbook;
        return _closedXmlWorkbook;
    }
}

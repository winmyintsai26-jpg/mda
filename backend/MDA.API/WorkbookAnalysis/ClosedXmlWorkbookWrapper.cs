using ClosedXML.Excel;
using System.Linq;

namespace MDA.API.WorkbookAnalysis;

internal class ClosedXmlWorkbookWrapper : IWorkbook, IInternalWorkbook
{
    private readonly XLWorkbook _workbook;

    public ClosedXmlWorkbookWrapper(XLWorkbook workbook, string originalFileName, string detectedFormat)
    {
        _workbook = workbook;
        OriginalFileName = originalFileName;
        DetectedFormat = detectedFormat;
        Worksheets = _workbook.Worksheets.Select(sheet => new ClosedXmlWorkbookSheetWrapper(sheet)).ToList();
    }

    public string OriginalFileName { get; }

    public string DetectedFormat { get; }

    public IReadOnlyList<IWorkbookSheet> Worksheets { get; }

    public XLWorkbook GetClosedXmlWorkbook() => _workbook;
}

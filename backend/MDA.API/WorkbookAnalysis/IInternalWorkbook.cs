using ClosedXML.Excel;

namespace MDA.API.WorkbookAnalysis;

internal interface IInternalWorkbook
{
    XLWorkbook GetClosedXmlWorkbook();
}

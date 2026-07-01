using ClosedXML.Excel;

namespace MDA.API.WorkbookAnalysis.Services;

public class WorkbookLoader
{
    public XLWorkbook Load(string filePath)
    {
        return new XLWorkbook(filePath);
    }
}
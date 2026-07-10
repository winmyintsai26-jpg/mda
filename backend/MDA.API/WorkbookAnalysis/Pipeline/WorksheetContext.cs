using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class WorksheetContext
{
    public WorksheetContext(IXLWorksheet worksheet, WorksheetScanResult scanResult)
    {
        Worksheet = worksheet;
        ScanResult = scanResult;
    }

    public IXLWorksheet Worksheet { get; }

    public WorksheetScanResult ScanResult { get; }

    public List<CandidateRegion> Regions { get; } = new();
}

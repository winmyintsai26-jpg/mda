using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Services;

public class WorksheetSegmentationEngine
{
    public List<CandidateRegion> Segment(IXLWorksheet worksheet)
    {
        return new List<CandidateRegion>();
    }
}
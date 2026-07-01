using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis;

public interface IRegionDetector
{
    List<CandidateRegion> Detect(WorksheetScanResult scanResult, WorkbookAnalysisOptions options);
}

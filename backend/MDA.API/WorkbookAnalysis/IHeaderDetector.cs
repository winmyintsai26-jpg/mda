using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis;

public interface IHeaderDetector
{
    HeaderDetectionResult Detect(WorksheetScanResult scanResult, CandidateRegion region);
}

using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis;

public interface ITableClassifier
{
    TableClassificationResult Classify(WorksheetScanResult scanResult, CandidateRegion region, HeaderDetectionResult headerResult);
}

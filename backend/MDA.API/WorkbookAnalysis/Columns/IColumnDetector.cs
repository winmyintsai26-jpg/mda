using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Columns;

public interface IColumnDetector
{
    List<DetectedColumn> DetectColumns(CandidateRegion region);
}

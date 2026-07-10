using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class WorksheetProjectionStage : IWorkbookAnalysisStage
{
    public void Execute(WorkbookContext context)
    {
        context.Result.Worksheets.Clear();

        foreach (var worksheetContext in context.Worksheets)
        {
            context.Result.Worksheets.Add(new WorksheetAnalysis
            {
                SheetName = worksheetContext.ScanResult.WorksheetName,
                TotalRows = worksheetContext.ScanResult.RowCount,
                TotalColumns = worksheetContext.ScanResult.ColumnCount,
                OccupiedCellCount = worksheetContext.ScanResult.OccupiedCellCount,
                CandidateRegions = worksheetContext.Regions
            });
        }
    }
}

namespace MDA.API.WorkbookAnalysis.Pipeline;

public interface IWorkbookAnalysisStage
{
    void Execute(WorkbookContext context);
}

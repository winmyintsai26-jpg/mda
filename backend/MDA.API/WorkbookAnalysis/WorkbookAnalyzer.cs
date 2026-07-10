using MDA.API.WorkbookAnalysis.Models;
using MDA.API.WorkbookAnalysis.Pipeline;

namespace MDA.API.WorkbookAnalysis;

public class WorkbookAnalyzer
{
    private readonly IReadOnlyList<IWorkbookAnalysisStage> _stages;
    private readonly WorkbookAnalysisOptions _options;

    public WorkbookAnalyzer(
        IEnumerable<IWorkbookAnalysisStage> stages,
        WorkbookAnalysisOptions options)
    {
        _stages = stages.ToList();
        _options = options;
    }

    public WorkbookAnalysisResult Analyze(IWorkbook workbook)
    {
        var context = WorkbookContext.Create(workbook, _options);

        foreach (var stage in _stages)
        {
            stage.Execute(context);
        }

        return context.Result;
    }
}

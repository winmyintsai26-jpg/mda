using MDA.API.WorkbookAnalysis.Validation;

namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class TableValidationStage : IWorkbookAnalysisStage
{
    private readonly ITableValidator _tableValidator;

    public TableValidationStage(ITableValidator tableValidator)
    {
        _tableValidator = tableValidator;
    }

    public void Execute(WorkbookContext context)
    {
        foreach (var worksheetContext in context.Worksheets)
        {
            foreach (var region in worksheetContext.Regions)
            {
                region.TableValidation = _tableValidator.Validate(region);
            }
        }
    }
}

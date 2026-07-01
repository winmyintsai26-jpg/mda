using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Validation;

public interface ITableValidator
{
    TableValidationResult Validate(CandidateRegion table);
}

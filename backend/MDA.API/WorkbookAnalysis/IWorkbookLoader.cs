namespace MDA.API.WorkbookAnalysis;

public interface IWorkbookLoader
{
    Task<WorkbookLoadResult> LoadAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
}

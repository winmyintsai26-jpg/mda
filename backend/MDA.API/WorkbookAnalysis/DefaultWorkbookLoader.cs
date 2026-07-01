using ClosedXML.Excel;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;

namespace MDA.API.WorkbookAnalysis;

public class DefaultWorkbookLoader : IWorkbookLoader
{
    public async Task<WorkbookLoadResult> LoadAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = new WorkbookLoadResult
        {
            OriginalFileName = fileName
        };

        var extension = Path.GetExtension(fileName)?.ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension))
        {
            result.ErrorMessage = "Unsupported workbook format: missing file extension.";
            return result;
        }

        result.DetectedFormat = extension.TrimStart('.');

        try
        {
            fileStream.Position = 0;

            if (extension is ".xlsx" or ".xlsm")
            {
                var workbook = new XLWorkbook(fileStream);
                result.Workbook = new ClosedXmlWorkbookWrapper(workbook, fileName, result.DetectedFormat);
                result.Success = true;
                return result;
            }

            if (extension == ".xls")
            {
                var workbook = new HSSFWorkbook(fileStream);
                result.Workbook = new NpoiWorkbookWrapper(workbook, fileName, result.DetectedFormat);
                result.Success = true;
                return result;
            }

            result.ErrorMessage = $"Unsupported workbook format: '{extension}'. Supported extensions are .xlsx, .xlsm, .xls.";
            return result;
        }
        catch (Exception ex)
        {
            return HandleLoadException(ex, result);
        }
    }

    private static WorkbookLoadResult HandleLoadException(Exception exception, WorkbookLoadResult result)
    {
        var message = exception.Message;
        if (message.Contains("password", StringComparison.OrdinalIgnoreCase))
        {
            result.ErrorMessage = "Password-protected workbook is not supported.";
            return result;
        }

        if (message.Contains("empty", StringComparison.OrdinalIgnoreCase) || message.Contains("no content", StringComparison.OrdinalIgnoreCase))
        {
            result.ErrorMessage = "Uploaded workbook is empty.";
            return result;
        }

        result.ErrorMessage = "Corrupted or unsupported workbook file.";
        return result;
    }
}

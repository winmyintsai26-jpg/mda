using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Pipeline;

public sealed class WorkbookContext
{
    private WorkbookContext(IWorkbook workbook, XLWorkbook closedWorkbook, WorkbookAnalysisOptions options)
    {
        Workbook = workbook;
        ClosedWorkbook = closedWorkbook;
        Options = options;
        Result = new WorkbookAnalysisResult();
    }

    public IWorkbook Workbook { get; }

    public XLWorkbook ClosedWorkbook { get; }

    public WorkbookAnalysisOptions Options { get; }

    public WorkbookAnalysisResult Result { get; }

    public List<WorksheetContext> Worksheets { get; } = new();

    public static WorkbookContext Create(IWorkbook workbook, WorkbookAnalysisOptions options)
    {
        if (workbook is not IInternalWorkbook internalWorkbook)
        {
            throw new InvalidOperationException("Workbook must support internal ClosedXML access for analysis.");
        }

        return new WorkbookContext(workbook, internalWorkbook.GetClosedXmlWorkbook(), options);
    }
}

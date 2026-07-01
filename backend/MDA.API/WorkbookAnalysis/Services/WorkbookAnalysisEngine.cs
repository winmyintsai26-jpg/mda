using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Services;

public class WorkbookAnalysisEngine
{
    private readonly WorkbookLoader _loader;
    private readonly OccupancyGridBuilder _gridBuilder;

    public WorkbookAnalysisEngine()
    {
        _loader = new WorkbookLoader();
        _gridBuilder = new OccupancyGridBuilder();
    }

    public WorkbookAnalysisResult Analyze(string filePath)
    {
        XLWorkbook workbook = _loader.Load(filePath);

        WorkbookAnalysisResult result = new();

        result.FileName = Path.GetFileName(filePath);

        foreach (IXLWorksheet sheet in workbook.Worksheets)
        {
            var grid = _gridBuilder.Build(sheet);

            WorksheetAnalysis worksheet = new();

            worksheet.SheetName = sheet.Name;
            worksheet.TotalRows = grid.Rows;
            worksheet.TotalColumns = grid.Columns;
            worksheet.OccupiedCellCount =
                grid.Cells.Count(c => c.IsOccupied);

            result.Worksheets.Add(worksheet);
        }

        return result;
    }
}
using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis;

public class WorkbookAnalyzer
{
    private readonly WorksheetScanner _scanner;
    private readonly IRegionDetector _regionDetector;
    private readonly IHeaderDetector _headerDetector;
    private readonly ITableClassifier _tableClassifier;
    private readonly WorkbookAnalysisOptions _options;

    public WorkbookAnalyzer(
        WorksheetScanner scanner,
        IRegionDetector regionDetector,
        IHeaderDetector headerDetector,
        ITableClassifier tableClassifier,
        WorkbookAnalysisOptions options)
    {
        _scanner = scanner;
        _regionDetector = regionDetector;
        _headerDetector = headerDetector;
        _tableClassifier = tableClassifier;
        _options = options;
    }

    public WorkbookAnalysisResult Analyze(IWorkbook workbook)
    {
        if (workbook is not IInternalWorkbook internalWorkbook)
        {
            throw new InvalidOperationException("Workbook must support internal ClosedXML access for analysis.");
        }

        var closedWorkbook = internalWorkbook.GetClosedXmlWorkbook();
        var result = new WorkbookAnalysisResult();

        foreach (var worksheet in closedWorkbook.Worksheets)
        {
            var scanResult = _scanner.Scan(worksheet);
            var regions = _regionDetector.Detect(scanResult, _options);

            for (var index = 0; index < regions.Count; index++)
            {
                regions[index].Id = index + 1;
                regions[index].Rows = ExtractRegionRows(scanResult.CellValues, regions[index]);
                regions[index].HeaderDetectionResult = _headerDetector.Detect(scanResult, regions[index]);
                regions[index].TableClassification = _tableClassifier.Classify(scanResult, regions[index], regions[index].HeaderDetectionResult);
            }

            var worksheetAnalysis = new WorksheetAnalysis
            {
                SheetName = scanResult.WorksheetName,
                TotalRows = scanResult.RowCount,
                TotalColumns = scanResult.ColumnCount,
                OccupiedCellCount = scanResult.OccupiedCellCount,
                CandidateRegions = regions
            };

            result.Worksheets.Add(worksheetAnalysis);
        }

        return result;
    }

    private static List<List<string>> ExtractRegionRows(List<List<string>> values, CandidateRegion region)
    {
        var rows = new List<List<string>>();

        for (var rowIndex = region.StartRow - 1; rowIndex <= region.EndRow - 1; rowIndex++)
        {
            var row = new List<string>();

            for (var columnIndex = region.StartColumn - 1; columnIndex <= region.EndColumn - 1; columnIndex++)
            {
                row.Add(values[rowIndex][columnIndex]);
            }

            rows.Add(row);
        }

        return rows;
    }
}

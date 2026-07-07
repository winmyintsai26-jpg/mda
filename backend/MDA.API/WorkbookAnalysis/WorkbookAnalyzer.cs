using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis.Columns;
using MDA.API.WorkbookAnalysis.DataTypes;
using MDA.API.WorkbookAnalysis.Models;
using MDA.API.WorkbookAnalysis.Validation;
using System.Text;

namespace MDA.API.WorkbookAnalysis;

public class WorkbookAnalyzer
{
    private readonly WorksheetScanner _scanner;
    private readonly IRegionDetector _regionDetector;
    private readonly IHeaderDetector _headerDetector;
    private readonly ITableClassifier _tableClassifier;
    private readonly ITableValidator _tableValidator;
    private readonly IColumnDetector _columnDetector;
    private readonly IDataTypeDetector _dataTypeDetector;
    private readonly WorkbookAnalysisOptions _options;

    public WorkbookAnalyzer(
        WorksheetScanner scanner,
        IRegionDetector regionDetector,
        IHeaderDetector headerDetector,
        ITableClassifier tableClassifier,
        ITableValidator tableValidator,
        IColumnDetector columnDetector,
        IDataTypeDetector dataTypeDetector,
        WorkbookAnalysisOptions options)
    {
        _scanner = scanner;
        _regionDetector = regionDetector;
        _headerDetector = headerDetector;
        _tableClassifier = tableClassifier;
        _tableValidator = tableValidator;
        _columnDetector = columnDetector;
        _dataTypeDetector = dataTypeDetector;
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
                RemoveRepeatedHeaderRows(regions[index]);
                regions[index].TableClassification = _tableClassifier.Classify(scanResult, regions[index], regions[index].HeaderDetectionResult);
                regions[index].TableValidation = _tableValidator.Validate(regions[index]);
                regions[index].Columns = _columnDetector.DetectColumns(regions[index]);
                regions[index].Columns = _dataTypeDetector.Detect(regions[index].Columns);
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

    private static void RemoveRepeatedHeaderRows(CandidateRegion region)
    {
        if (region.HeaderDetectionResult?.WinningHeader == null)
        {
            return;
        }

        var headerRows = region.HeaderDetectionResult.WinningHeader.HeaderCells;
        if (!headerRows.Any())
        {
            return;
        }

        var normalizedHeaderRows = headerRows.Select(GetNormalizedRow).ToList();
        var headerRowCount = headerRows.Count;
        var headerStartIndex = region.HeaderDetectionResult.WinningHeader.HeaderStartRowRelative;
        var dataStartIndex = headerStartIndex + headerRowCount;

        var cleanedRows = new List<List<string>>();
        cleanedRows.AddRange(region.Rows.Take(headerStartIndex));

        for (var rowIndex = dataStartIndex; rowIndex < region.Rows.Count; rowIndex++)
        {
            var row = region.Rows[rowIndex];
            if (IsRepeatedHeaderRow(row, normalizedHeaderRows))
            {
                continue;
            }

            cleanedRows.Add(row);
        }

        region.Rows = cleanedRows;
    }

    private static List<string> GetEffectiveHeaderRow(List<List<string>> headerRows)
    {
        var lastNonEmptyHeader = headerRows.LastOrDefault(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell)));
        return lastNonEmptyHeader?.ToList() ?? headerRows.Last().ToList();
    }

    private static bool IsRepeatedHeaderRow(List<string> row, List<List<string>> normalizedHeaderRows)
    {
        foreach (var headerRow in normalizedHeaderRows)
        {
            if (IsRowEqualToHeaderRow(row, headerRow))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsRowEqualToHeaderRow(List<string> row, List<string> headerRow)
    {
        var normalizedRow = GetNormalizedRow(row);

        if (normalizedRow.Count != headerRow.Count)
        {
            return false;
        }

        for (var index = 0; index < normalizedRow.Count; index++)
        {
            var rowValue = normalizedRow[index];
            var headerValue = headerRow[index];

            if (!string.Equals(rowValue, headerValue, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    private static List<string> GetNormalizedRow(List<string> row)
    {
        return row.Select(NormalizeCell).ToList();
    }

    private static string NormalizeCell(string value)
    {
        return (value ?? string.Empty).Trim();
    }
}

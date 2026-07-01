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

        var headerRow = GetNormalizedRow(GetEffectiveHeaderRow(headerRows));
        var headerRowCount = headerRows.Count;
        var headerStartIndex = region.HeaderDetectionResult.WinningHeader.HeaderStartRowRelative;
        var dataStartIndex = headerStartIndex + headerRowCount;

        LogHeaderComparison(region, headerRow, dataStartIndex);

        var cleanedRows = new List<List<string>>();
        cleanedRows.AddRange(region.Rows.Take(headerStartIndex));

        for (var rowIndex = dataStartIndex; rowIndex < region.Rows.Count; rowIndex++)
        {
            var row = region.Rows[rowIndex];
            if (IsRepeatedHeaderRow(row, headerRow))
            {
                continue;
            }

            cleanedRows.Add(row);
        }

        region.Rows = cleanedRows;
    }

    private static void LogHeaderComparison(CandidateRegion region, List<string> headerRow, int dataStartIndex)
    {
        if (region.Rows.Count <= dataStartIndex)
        {
            return;
        }

        var firstDataRow = region.Rows[dataStartIndex];
        var normalizedDataRow = GetNormalizedRow(firstDataRow);

        Console.WriteLine("[WorkbookAnalyzer] Header comparison details:");
        Console.WriteLine($"  Region [{region.StartRow},{region.StartColumn}] - [{region.EndRow},{region.EndColumn}]");
        Console.WriteLine($"  HeaderStartRowRelative={region.HeaderDetectionResult!.WinningHeader.HeaderStartRowRelative}, HeaderRowCount={region.HeaderDetectionResult.WinningHeader.HeaderCells.Count}, DataStartIndex={dataStartIndex}");
        Console.WriteLine($"  Header rows count: {region.HeaderDetectionResult.WinningHeader.HeaderCells.Count}");
        Console.WriteLine($"  Header row raw: {FormatRowForLog(GetEffectiveHeaderRow(region.HeaderDetectionResult.WinningHeader.HeaderCells))}");
        Console.WriteLine($"  Header row normalized: {FormatRowForLog(headerRow)}");
        Console.WriteLine($"  First data row raw: {FormatRowForLog(firstDataRow)}");
        Console.WriteLine($"  First data row normalized: {FormatRowForLog(normalizedDataRow)}");

        if (firstDataRow.Count != headerRow.Count)
        {
            Console.WriteLine($"  Row counts differ: dataRow={firstDataRow.Count} headerRow={headerRow.Count}");
        }

        var headerNormalized = GetNormalizedRow(headerRow);
        for (var index = 0; index < Math.Max(firstDataRow.Count, headerNormalized.Count); index++)
        {
            var rawCell = index < firstDataRow.Count ? firstDataRow[index] : null;
            var normalizedCell = index < normalizedDataRow.Count ? normalizedDataRow[index] : null;
            var headerCell = index < headerNormalized.Count ? headerNormalized[index] : null;
            var equal = index < normalizedDataRow.Count && index < headerNormalized.Count && string.Equals(normalizedCell, headerCell, StringComparison.OrdinalIgnoreCase);
            Console.WriteLine($"    Col {index}: raw=" + FormatCellForLog(rawCell) + " header=" + FormatCellForLog(headerCell) + " norm=" + FormatCellForLog(normalizedCell) + " equal=" + equal);
        }
    }

    private static string FormatRowForLog(List<string> row)
    {
        return string.Join(" | ", row.Select(FormatCellForLog));
    }

    private static string FormatCellForLog(string? cell)
    {
        if (cell == null)
        {
            return "<null>";
        }

        var visible = cell
            .Replace("\r", "\\r")
            .Replace("\n", "\\n")
            .Replace("\t", "\\t");

        var codePoints = string.Join(" ", visible.Select(c => ((int)c).ToString("X4")));
        return $"<${visible}>[{codePoints}]";
    }

    private static List<string> GetEffectiveHeaderRow(List<List<string>> headerRows)
    {
        var lastNonEmptyHeader = headerRows.LastOrDefault(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell)));
        return lastNonEmptyHeader?.ToList() ?? headerRows.Last().ToList();
    }

    private static bool IsRepeatedHeaderRow(List<string> row, List<string> headerRow)
    {
        if (row.Count != headerRow.Count)
        {
            return false;
        }

        for (var index = 0; index < row.Count; index++)
        {
            var rowValue = NormalizeCell(row[index]);
            var headerValue = NormalizeCell(headerRow[index]);

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

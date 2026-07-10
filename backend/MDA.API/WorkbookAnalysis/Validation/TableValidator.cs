using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Validation;

public class TableValidator : ITableValidator
{
    private readonly WorkbookAnalysisOptions _options;

    public TableValidator(WorkbookAnalysisOptions options)
    {
        _options = options;
    }

    public TableValidationResult Validate(CandidateRegion table)
    {
        var result = new TableValidationResult();

        var headerRows = ExtractHeaderRows(table);
        var headerRow = GetEffectiveHeaderRow(headerRows);
        var dataRows = ExtractDataRows(table, headerRows.Count);

        ValidateHeader(result, headerRows, headerRow);
        ValidateMinimumDataRows(result, dataRows);
        ValidateColumnConsistency(result, headerRow, dataRows);
        ValidateDuplicateHeaders(result, headerRow);
        ValidateEmptyHeaders(result, headerRow);

        result.Confidence = CalculateConfidence(result, headerRow, _options.InitialValidationConfidence);
        result.IsValid = result.Confidence >= _options.ValidConfidenceThreshold;

        return result;
    }

    private static List<List<string>> ExtractHeaderRows(CandidateRegion table)
    {
        return table.HeaderDetectionResult?.WinningHeader?.HeaderCells ?? new List<List<string>>();
    }

    private static List<string> GetEffectiveHeaderRow(List<List<string>> headerRows)
    {
        if (!headerRows.Any())
        {
            return new List<string>();
        }

        var lastNonEmptyHeader = headerRows.LastOrDefault(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell)));
        return lastNonEmptyHeader?.ToList() ?? headerRows.Last().ToList();
    }

    private static List<List<string>> ExtractDataRows(CandidateRegion table, int headerRowCount)
    {
        if (headerRowCount <= 0 || table.HeaderDetectionResult?.WinningHeader == null)
        {
            return new List<List<string>>();
        }

        var headerStartOffset = table.HeaderDetectionResult.WinningHeader.HeaderStartRowRelative;
        var dataStartIndex = headerStartOffset + headerRowCount;

        return table.Rows
            .Skip(dataStartIndex)
            .Where(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell)))
            .ToList();
    }

    private static void ValidateHeader(TableValidationResult result, List<List<string>> headerRows, List<string> headerRow)
    {
        if (!headerRows.Any() || !headerRow.Any() || headerRow.All(string.IsNullOrWhiteSpace))
        {
            result.Issues.Add("Header is missing.");
        }
    }

    private static void ValidateMinimumDataRows(TableValidationResult result, List<List<string>> dataRows)
    {
        if (dataRows.Count < 2)
        {
            result.Issues.Add("Table does not contain enough data rows.");
        }
    }

    private static void ValidateColumnConsistency(TableValidationResult result, List<string> headerRow, List<List<string>> dataRows)
    {
        if (!headerRow.Any() || !dataRows.Any())
        {
            return;
        }

        var expectedCount = headerRow.Count;
        var inconsistentCount = dataRows.Count(row => row.Count != expectedCount);

        if (inconsistentCount > 0)
        {
            result.Issues.Add("Inconsistent column counts detected.");
        }
    }

    private static void ValidateDuplicateHeaders(TableValidationResult result, List<string> headerRow)
    {
        var duplicates = headerRow
            .Where(cell => !string.IsNullOrWhiteSpace(cell))
            .GroupBy(cell => cell.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        foreach (var duplicate in duplicates)
        {
            result.Warnings.Add($"Duplicate header '{duplicate}' detected.");
        }
    }

    private static void ValidateEmptyHeaders(TableValidationResult result, List<string> headerRow)
    {
        if (!headerRow.Any())
        {
            return;
        }

        var blankHeaders = headerRow.Count(string.IsNullOrWhiteSpace);
        if (blankHeaders <= 0)
        {
            return;
        }

        if (blankHeaders >= headerRow.Count)
        {
            result.Issues.Add("Too many blank headers.");
        }
    }

    private static int CalculateConfidence(TableValidationResult result, List<string> headerRow, int initialConfidence)
    {
        var confidence = initialConfidence;

        if (result.Issues.Contains("Header is missing."))
        {
            confidence -= 40;
        }

        if (result.Issues.Contains("Table does not contain enough data rows."))
        {
            confidence -= 30;
        }

        if (result.Issues.Contains("Inconsistent column counts detected."))
        {
            confidence -= 20;
        }

        var blankHeaderCount = headerRow.Count(string.IsNullOrWhiteSpace);
        confidence -= blankHeaderCount * 5;

        return Math.Clamp(confidence, 0, 100);
    }
}

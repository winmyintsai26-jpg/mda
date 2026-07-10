using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis;

internal static class RegionRows
{
    public static List<List<string>> Extract(List<List<string>> values, CandidateRegion region)
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

    public static void RemoveRepeatedHeaderRows(CandidateRegion region)
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

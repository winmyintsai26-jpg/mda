using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis.Columns;

public class DefaultColumnDetector : IColumnDetector
{
    public List<DetectedColumn> DetectColumns(CandidateRegion region)
    {
        if (region.TableValidation?.IsValid != true)
        {
            return new List<DetectedColumn>();
        }

        var headerRows = region.HeaderDetectionResult?.WinningHeader?.HeaderCells ?? new List<List<string>>();
        if (!headerRows.Any())
        {
            return new List<DetectedColumn>();
        }

        var headerRow = GetEffectiveHeaderRow(headerRows);
        var headerCount = headerRow.Count;
        var headerStartOffset = region.HeaderDetectionResult!.WinningHeader.HeaderStartRowRelative;
        var dataStartIndex = headerStartOffset + headerRows.Count;

        var columns = Enumerable.Range(0, headerCount)
            .Select(index => new DetectedColumn
            {
                Index = index,
                Header = index < headerRow.Count ? headerRow[index] : string.Empty,
                Values = new List<string>()
            })
            .ToList();

        for (var rowIndex = dataStartIndex; rowIndex < region.Rows.Count; rowIndex++)
        {
            var row = region.Rows[rowIndex];
            if (!row.Any(cell => !string.IsNullOrWhiteSpace(cell)))
            {
                continue;
            }

            for (var columnIndex = 0; columnIndex < headerCount; columnIndex++)
            {
                var value = columnIndex < row.Count ? row[columnIndex] : string.Empty;
                columns[columnIndex].Values.Add(value);
            }
        }

        foreach (var column in columns)
        {
            column.NonEmptyValueCount = column.Values.Count(value => !string.IsNullOrWhiteSpace(value));
            column.EmptyValueCount = column.Values.Count - column.NonEmptyValueCount;
            column.IsCompletelyEmpty = column.NonEmptyValueCount == 0;
        }

        return columns;
    }

    private static List<string> GetEffectiveHeaderRow(List<List<string>> headerRows)
    {
        var lastNonEmptyHeader = headerRows.LastOrDefault(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell)));
        return lastNonEmptyHeader?.ToList() ?? headerRows.Last().ToList();
    }
}

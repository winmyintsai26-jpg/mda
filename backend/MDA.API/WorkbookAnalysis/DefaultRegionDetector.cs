using System.Linq;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis;

public class DefaultRegionDetector : IRegionDetector
{
    public List<CandidateRegion> Detect(WorksheetScanResult scanResult, WorkbookAnalysisOptions options)
    {
        var regions = new List<CandidateRegion>();

        if (scanResult.RowCount == 0 || scanResult.ColumnCount == 0)
        {
            return regions;
        }

        var rowOccupied = Enumerable.Range(0, scanResult.RowCount)
            .Select(rowIndex => scanResult.Occupied[rowIndex].Any())
            .ToList();

        var rowBlocks = BuildLineGroups(rowOccupied, options.MaxBlankRows);

        foreach (var rowBlock in rowBlocks)
        {
            var columnOccupied = BuildColumnOccupancy(scanResult.Occupied, rowBlock.start, rowBlock.end);
            var columnBlocks = BuildLineGroups(columnOccupied, options.MaxBlankColumns);

            foreach (var columnBlock in columnBlocks)
            {
                regions.Add(new CandidateRegion
                {
                    StartRow = scanResult.StartRow + rowBlock.start,
                    EndRow = scanResult.StartRow + rowBlock.end,
                    StartColumn = scanResult.StartColumn + columnBlock.start,
                    EndColumn = scanResult.StartColumn + columnBlock.end
                });
            }
        }

        return MergeCloseRegions(regions, options);
    }

    private static List<CandidateRegion> MergeCloseRegions(List<CandidateRegion> regions, WorkbookAnalysisOptions options)
    {
        if (!regions.Any())
        {
            return regions;
        }

        var mergedRegions = new List<CandidateRegion>(regions);
        var didMerge = true;

        while (didMerge)
        {
            didMerge = false;

            for (var i = 0; i < mergedRegions.Count; i++)
            {
                for (var j = i + 1; j < mergedRegions.Count; j++)
                {
                    var first = mergedRegions[i];
                    var second = mergedRegions[j];

                    if (ShouldMerge(first, second, options))
                    {
                        mergedRegions[i] = MergeRegions(first, second);
                        mergedRegions.RemoveAt(j);
                        didMerge = true;
                        break;
                    }
                }

                if (didMerge)
                {
                    break;
                }
            }
        }

        return RemoveContainedRegions(mergedRegions);
    }

    private static List<CandidateRegion> RemoveContainedRegions(List<CandidateRegion> regions)
    {
        var filtered = new List<CandidateRegion>();

        foreach (var region in regions.OrderByDescending(r => GetArea(r)))
        {
            if (!filtered.Any(existing => Contains(existing, region)))
            {
                filtered.Add(region);
            }
        }

        return filtered;
    }

    private static bool Contains(CandidateRegion outer, CandidateRegion inner)
    {
        return outer.StartRow <= inner.StartRow
            && outer.EndRow >= inner.EndRow
            && outer.StartColumn <= inner.StartColumn
            && outer.EndColumn >= inner.EndColumn;
    }

    private static int GetArea(CandidateRegion region)
    {
        return (region.EndRow - region.StartRow + 1) * (region.EndColumn - region.StartColumn + 1);
    }

    private static bool ShouldMerge(CandidateRegion first, CandidateRegion second, WorkbookAnalysisOptions options)
    {
        var rowGap = GetGap(first.StartRow, first.EndRow, second.StartRow, second.EndRow);
        var colGap = GetGap(first.StartColumn, first.EndColumn, second.StartColumn, second.EndColumn);
        var rowOverlap = GetOverlap(first.StartRow, first.EndRow, second.StartRow, second.EndRow);
        var colOverlap = GetOverlap(first.StartColumn, first.EndColumn, second.StartColumn, second.EndColumn);

        if (rowOverlap > 0 && colOverlap > 0)
        {
            return true;
        }

        if (rowOverlap > 0 && colGap <= options.MaxBlankColumns)
        {
            return true;
        }

        if (colOverlap > 0 && rowGap <= options.MaxBlankRows)
        {
            return true;
        }

        return false;
    }

    private static int GetGap(int firstStart, int firstEnd, int secondStart, int secondEnd)
    {
        if (secondStart > firstEnd)
        {
            return secondStart - firstEnd - 1;
        }

        if (firstStart > secondEnd)
        {
            return firstStart - secondEnd - 1;
        }

        return 0;
    }

    private static int GetOverlap(int firstStart, int firstEnd, int secondStart, int secondEnd)
    {
        return Math.Max(0, Math.Min(firstEnd, secondEnd) - Math.Max(firstStart, secondStart) + 1);
    }

    private static CandidateRegion MergeRegions(CandidateRegion first, CandidateRegion second)
    {
        return new CandidateRegion
        {
            StartRow = Math.Min(first.StartRow, second.StartRow),
            EndRow = Math.Max(first.EndRow, second.EndRow),
            StartColumn = Math.Min(first.StartColumn, second.StartColumn),
            EndColumn = Math.Max(first.EndColumn, second.EndColumn)
        };
    }

    private static List<bool> BuildColumnOccupancy(List<List<bool>> occupied, int rowStart, int rowEnd)
    {
        var columnCount = occupied[rowStart].Count;
        var columnLines = new List<bool>(columnCount);

        for (var columnIndex = 0; columnIndex < columnCount; columnIndex++)
        {
            var anyOccupied = false;

            for (var rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++)
            {
                if (occupied[rowIndex][columnIndex])
                {
                    anyOccupied = true;
                    break;
                }
            }

            columnLines.Add(anyOccupied);
        }

        return columnLines;
    }

    private static List<bool> BuildRowOccupancy(List<List<bool>> occupied, int columnStart, int columnEnd, int rowStart, int rowEnd)
    {
        var rowLines = new List<bool>(rowEnd - rowStart + 1);

        for (var rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++)
        {
            var anyOccupied = false;

            for (var columnIndex = columnStart; columnIndex <= columnEnd; columnIndex++)
            {
                if (occupied[rowIndex][columnIndex])
                {
                    anyOccupied = true;
                    break;
                }
            }

            rowLines.Add(anyOccupied);
        }

        return rowLines;
    }

    private static List<(int start, int end)> BuildLineGroups(List<bool> occupiedLines, int maxGap)
    {
        var groups = new List<(int start, int end)>();
        int? groupStart = null;
        int lastOccupiedIndex = -1;
        int currentGap = 0;

        for (var index = 0; index < occupiedLines.Count; index++)
        {
            if (occupiedLines[index])
            {
                if (groupStart == null)
                {
                    groupStart = index;
                }

                currentGap = 0;
                lastOccupiedIndex = index;
                continue;
            }

            if (groupStart == null)
            {
                continue;
            }

            currentGap++;

            if (currentGap > maxGap)
            {
                groups.Add((groupStart.Value, lastOccupiedIndex));
                groupStart = null;
                currentGap = 0;
            }
        }

        if (groupStart != null)
        {
            groups.Add((groupStart.Value, lastOccupiedIndex));
        }

        return groups;
    }
}

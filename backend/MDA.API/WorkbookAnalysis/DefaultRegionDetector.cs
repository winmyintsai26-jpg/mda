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
                var innerRowOccupied = BuildRowOccupancy(scanResult.Occupied, columnBlock.start, columnBlock.end, rowBlock.start, rowBlock.end);
                var innerRowBlocks = BuildLineGroups(innerRowOccupied, options.MaxBlankRows);

                foreach (var innerRowBlock in innerRowBlocks)
                {
                    regions.Add(new CandidateRegion
                    {
                        StartRow = scanResult.StartRow + innerRowBlock.start,
                        EndRow = scanResult.StartRow + innerRowBlock.end,
                        StartColumn = scanResult.StartColumn + columnBlock.start,
                        EndColumn = scanResult.StartColumn + columnBlock.end
                    });
                }
            }
        }

        return regions;
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

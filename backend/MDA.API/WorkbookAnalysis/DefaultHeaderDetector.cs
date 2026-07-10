using System.Linq;
using System.Text.RegularExpressions;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.WorkbookAnalysis;

public class DefaultHeaderDetector : IHeaderDetector
{
    private readonly WorkbookAnalysisOptions _options;
    private static readonly Regex NoteLikeText = new(@"\b(note|remarks|comments|summary|description)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex SentenceLikeText = new(@"[.!?].{10,}", RegexOptions.Compiled);
    private static readonly Regex DatePattern = new(@"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", RegexOptions.Compiled);

    public DefaultHeaderDetector(WorkbookAnalysisOptions options)
    {
        _options = options;
    }

    public HeaderDetectionResult Detect(WorksheetScanResult scanResult, CandidateRegion region)
    {
        var result = new HeaderDetectionResult();
        var regionRows = RegionRows.Extract(scanResult.CellValues, region);
        var maxStart = Math.Min(regionRows.Count - 1, _options.HeaderSearchDepth - 1);

        for (var startRow = 0; startRow <= maxStart; startRow++)
        {
            for (var headerRowCount = 1; headerRowCount <= _options.MaxHeaderRows; headerRowCount++)
            {
                if (startRow + headerRowCount > regionRows.Count)
                {
                    break;
                }

                var candidate = BuildHeaderCandidate(scanResult, region, regionRows, startRow, headerRowCount);
                result.CandidateHeaders.Add(candidate);
            }
        }

        result.WinningHeader = result.CandidateHeaders
            .OrderByDescending(c => c.Score)
            .FirstOrDefault() ?? new HeaderCandidate();

        return result;
    }

    private HeaderCandidate BuildHeaderCandidate(WorksheetScanResult scanResult, CandidateRegion region, List<List<string>> regionRows, int startRow, int headerRowCount)
    {
        var headerCells = regionRows
            .Skip(startRow)
            .Take(headerRowCount)
            .Select(row => row.ToList())
            .ToList();

        var candidate = new HeaderCandidate
        {
            HeaderStartRowRelative = startRow,
            HeaderEndRowRelative = startRow + headerRowCount - 1,
            HeaderStartRow = region.StartRow + startRow,
            HeaderEndRow = region.StartRow + startRow + headerRowCount - 1,
            HeaderCells = headerCells
        };

        var breakdown = new ScoreBreakdown
        {
            DensityScore = ComputeDensityScore(candidate.HeaderCells),
            TextScore = ComputeTextScore(candidate.HeaderCells),
            LabelScore = ComputeHeaderLabelScore(candidate.HeaderCells),
            UniquenessScore = ComputeUniquenessScore(candidate.HeaderCells),
            PositionScore = ComputePositionScore(startRow),
            DataConsistencyScore = ComputeDataConsistencyScore(regionRows, startRow, headerRowCount),
            TypeContrastScore = ComputeTypeContrastScore(regionRows, startRow, headerRowCount)
        };

        var penalty = ComputePenalty(candidate.HeaderCells);
        candidate.Breakdown = breakdown;
        candidate.Score = Math.Clamp(breakdown.Total - penalty, 0, 100);
        candidate.Reasons = BuildReasons(candidate, penalty);

        return candidate;
    }

    private int ComputeDensityScore(List<List<string>> headerRows)
    {
        var populatedCells = headerRows.Sum(row => row.Count(cell => !string.IsNullOrWhiteSpace(cell)));
        var totalCells = headerRows.Sum(row => row.Count);
        if (totalCells == 0) return 0;

        return (int)Math.Round((populatedCells / (double)totalCells) * 20);
    }

    private int ComputeTextScore(List<List<string>> headerRows)
    {
        var textCells = headerRows.Sum(row => row.Count(cell => IsPrimarilyText(cell)));
        var totalCells = headerRows.Sum(row => row.Count);
        if (totalCells == 0) return 0;

        return (int)Math.Round((textCells / (double)totalCells) * 20);
    }

    private int ComputeUniquenessScore(List<List<string>> headerRows)
    {
        var values = headerRows.SelectMany(row => row).Where(cell => !string.IsNullOrWhiteSpace(cell)).ToList();
        if (values.Count == 0) return 0;

        var uniqueCount = values.Distinct(StringComparer.OrdinalIgnoreCase).Count();
        return (int)Math.Round((uniqueCount / (double)values.Count) * 20);
    }

    private int ComputePositionScore(int headerRowCount)
    {
        return headerRowCount switch
        {
            1 => 20,
            2 => 15,
            3 => 10,
            _ => 0
        };
    }

    private int ComputeDataConsistencyScore(List<List<string>> regionRows, int startRow, int headerRowCount)
    {
        var dataRows = regionRows.Skip(startRow + headerRowCount).Take(3).ToList();
        if (!dataRows.Any()) return 0;

        var dataCellCounts = dataRows.Select(row => row.Count(cell => !string.IsNullOrWhiteSpace(cell))).ToList();
        var average = dataCellCounts.Average();
        var variance = dataCellCounts.Any() ? dataCellCounts.Sum(count => Math.Pow(count - average, 2)) / dataCellCounts.Count : 0;
        var consistency = variance == 0 ? 1.0 : 1.0 / (1.0 + variance);

        return (int)Math.Round(consistency * 20);
    }

    private int ComputeHeaderLabelScore(List<List<string>> headerRows)
    {
        var labelCells = headerRows.SelectMany(row => row)
            .Count(cell => IsDescriptiveLabel(cell));
        var totalCells = headerRows.Sum(row => row.Count);
        if (totalCells == 0) return 0;

        return (int)Math.Round((labelCells / (double)totalCells) * 20);
    }

    private int ComputeTypeContrastScore(List<List<string>> regionRows, int startRow, int headerRowCount)
    {
        var dataRows = regionRows.Skip(startRow + headerRowCount).Take(3).ToList();
        if (!dataRows.Any()) return 0;

        var headerRows = regionRows.Skip(startRow).Take(headerRowCount).ToList();
        var columnCount = Math.Max(headerRows.Max(row => row.Count), dataRows.Max(row => row.Count));
        var score = 0.0;
        var columns = 0;

        for (var columnIndex = 0; columnIndex < columnCount; columnIndex++)
        {
            var headerType = GetDominantColumnType(headerRows, columnIndex);
            var dataType = GetDominantColumnType(dataRows, columnIndex);
            if (headerType == CellType.Empty || dataType == CellType.Empty)
            {
                continue;
            }

            if (headerType == CellType.Label && dataType != CellType.Label)
            {
                score += 2;
            }
            else if (headerType == dataType)
            {
                score -= 1;
            }

            columns++;
        }

        if (columns == 0) return 0;

        return (int)Math.Round(Math.Max(0, Math.Min(20, (score / columns) * 20)));
    }

    private enum CellType
    {
        Empty,
        Label,
        Text,
        NumericOrDate
    }

    private static CellType GetDominantColumnType(List<List<string>> rows, int columnIndex)
    {
        var types = rows
            .Select(row => row.ElementAtOrDefault(columnIndex))
            .Select(ClassifyCellType)
            .Where(type => type != CellType.Empty)
            .ToList();

        if (!types.Any()) return CellType.Empty;
        return types.GroupBy(type => type)
            .OrderByDescending(group => group.Count())
            .First().Key;
    }

    private static CellType ClassifyCellType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return CellType.Empty;
        }

        if (IsDescriptiveLabel(value))
        {
            return CellType.Label;
        }

        if (IsNumeric(value) || DatePattern.IsMatch(value))
        {
            return CellType.NumericOrDate;
        }

        return CellType.Text;
    }

    private static bool IsDescriptiveLabel(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        if (!IsPrimarilyText(value)) return false;
        if (SentenceLikeText.IsMatch(value) || NoteLikeText.IsMatch(value)) return false;
        if (DatePattern.IsMatch(value)) return false;

        var trimmed = value.Trim();
        if (trimmed.Length > 40) return false;

        var words = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length > 5) return false;

        var digits = trimmed.Count(char.IsDigit);
        if (digits > 0 && trimmed.Count(char.IsLetter) < digits) return false;

        return true;
    }

    private int ComputePenalty(List<List<string>> headerRows)
    {
        var penalty = 0;

        foreach (var row in headerRows)
        {
            if (IsMergedTitleRow(row))
            {
                penalty += 25;
            }

            if (IsNoteLikeRow(row))
            {
                penalty += 20;
            }

            if (IsDateOrNumericDominated(row))
            {
                penalty += 20;
            }

            if (IsMostlyEmpty(row))
            {
                penalty += 10;
            }
        }

        return Math.Min(penalty, 50);
    }

    private static bool IsPrimarilyText(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        if (SentenceLikeText.IsMatch(value)) return false;
        if (NoteLikeText.IsMatch(value)) return false;

        var digits = value.Count(char.IsDigit);
        var letters = value.Count(char.IsLetter);
        return letters >= digits;
    }

    private static bool IsMergedTitleRow(List<string> row)
    {
        var populated = row.Where(cell => !string.IsNullOrWhiteSpace(cell)).ToList();
        if (populated.Count <= 2 && populated.Any(cell => cell.Length > 30))
        {
            return true;
        }

        return populated.Count == 1 && populated.First().Length > 40;
    }

    private static bool IsNoteLikeRow(List<string> row)
    {
        foreach (var cell in row)
        {
            if (string.IsNullOrWhiteSpace(cell))
            {
                continue;
            }

            if (SentenceLikeText.IsMatch(cell) || NoteLikeText.IsMatch(cell))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsDateOrNumericDominated(List<string> row)
    {
        var values = row.Where(cell => !string.IsNullOrWhiteSpace(cell)).ToList();
        if (!values.Any()) return false;

        var numericOrDates = values.Count(cell => IsNumeric(cell) || DatePattern.IsMatch(cell));
        return numericOrDates >= Math.Ceiling(values.Count * 0.7);
    }

    private static bool IsNumeric(string value)
    {
        var trimmed = value.Trim();
        return double.TryParse(trimmed, out _);
    }

    private static bool IsMostlyEmpty(List<string> row)
    {
        var populated = row.Count(cell => !string.IsNullOrWhiteSpace(cell));
        return populated <= Math.Max(1, row.Count / 4);
    }

    private static List<string> BuildReasons(HeaderCandidate candidate, int penalty)
    {
        var reasons = new List<string>();

        if (candidate.Breakdown.DensityScore >= 15)
        {
            reasons.Add("Many populated cells");
        }

        if (candidate.Breakdown.TextScore >= 15)
        {
            reasons.Add("Mostly text");
        }

        if (candidate.Breakdown.UniquenessScore >= 15)
        {
            reasons.Add("Unique values");
        }

        if (candidate.Breakdown.DataConsistencyScore >= 15)
        {
            reasons.Add("Followed by consistent data rows");
        }

        if (candidate.Breakdown.LabelScore >= 10)
        {
            reasons.Add("Contains descriptive label text");
        }

        if (candidate.Breakdown.TypeContrastScore >= 10)
        {
            reasons.Add("Header differs from following row types");
        }

        if (candidate.Breakdown.PositionScore >= 15)
        {
            reasons.Add("Top of candidate region");
        }

        if (candidate.Breakdown.DensityScore <= 5)
        {
            reasons.Add("Mostly empty");
        }

        if (candidate.Breakdown.TextScore <= 5)
        {
            reasons.Add("Mostly numeric or note-like text");
        }

        if (penalty > 0)
        {
            if (candidate.HeaderCells.Any(row => IsMergedTitleRow(row)))
            {
                reasons.Add("Looks like a merged title row");
            }

            if (candidate.HeaderCells.Any(row => IsNoteLikeRow(row)))
            {
                reasons.Add("Contains note-like text");
            }

            if (candidate.HeaderCells.Any(row => IsDateOrNumericDominated(row)))
            {
                reasons.Add("Dominated by dates or numeric values");
            }
        }

        return reasons;
    }
}

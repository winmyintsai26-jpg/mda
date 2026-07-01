using MDA.API.WorkbookAnalysis.Models;
using System.Text.RegularExpressions;

namespace MDA.API.WorkbookAnalysis;

public class DefaultTableClassifier : ITableClassifier
{
    private static readonly Regex SummaryKeywords = new(@"\b(total|subtotal|average|avg|sum|summary|grand total)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex SentenceLikeText = new(@"[.!?].{10,}", RegexOptions.Compiled);

    public TableClassificationResult Classify(WorksheetScanResult scanResult, CandidateRegion region, HeaderDetectionResult headerResult)
    {
        var result = new TableClassificationResult();
        var rows = region.Rows;
        var columnCount = rows.Any() ? rows.Max(row => row.Count) : 0;
        var rowCount = rows.Count;
        var denseRatio = ComputeDensityRatio(rows);
        var numericRatio = ComputeNumericRatio(rows);
        var textRatio = ComputeTextRatio(rows);
        var headerScore = ComputeHeaderScore(headerResult);
        var rectangularity = ComputeRectangularity(rows, columnCount);
        var repeatingStructure = ComputeRepeatingStructure(rows);
        var summaryKeywords = CountSummaryKeywords(rows);
        var sentenceRows = CountSentenceLikeRows(rows);
        var longTextRows = CountLongTextRows(rows);

        var tabularScore = headerScore + rowCountScore(rowCount) + (int)(rectangularity * 20) + (int)(repeatingStructure * 10);
        var statisticsScore = (int)(numericRatio * 40) + (int)(rectangularity * 20) + (rowCount <= 10 ? 15 : 0) + (headerScore > 0 ? 10 : 0);
        var summaryScore = (int)(textRatio * 30) + Math.Min(summaryKeywords * 15, 45) + (rowCount <= 8 ? 15 : 0);
        var notesScore = Math.Min(longTextRows * 15, 45) + Math.Min(sentenceRows * 20, 40) + (columnCount <= 4 ? 10 : 0);
        var metadataScore = (rowCount <= 5 ? 15 : 0) + (columnCount <= 4 ? 10 : 0) + (denseRatio <= 0.5 ? 15 : 0);

        var candidates = new List<TableClassificationCandidate>
        {
            CreateCandidate(RegionType.TabularData, tabularScore, BuildTabularReasons(headerScore, rowCount, rectangularity, repeatingStructure)),
            CreateCandidate(RegionType.Statistics, statisticsScore, BuildStatisticsReasons(numericRatio, rectangularity, rowCount, headerScore)),
            CreateCandidate(RegionType.Summary, summaryScore, BuildSummaryReasons(textRatio, summaryKeywords, rowCount)),
            CreateCandidate(RegionType.Notes, notesScore, BuildNotesReasons(longTextRows, sentenceRows, columnCount)),
            CreateCandidate(RegionType.Metadata, metadataScore, BuildMetadataReasons(rowCount, columnCount, denseRatio)),
            CreateCandidate(RegionType.Unknown, 10, new List<string> { "No strong classification pattern detected" })
        };

        result.ClassificationCandidates = candidates;
        result.WinningClassification = candidates.OrderByDescending(c => c.Score).First();
        return result;
    }

    private static int rowCountScore(int rowCount)
    {
        if (rowCount >= 15) return 20;
        if (rowCount >= 8) return 10;
        return 0;
    }

    private static int ComputeHeaderScore(HeaderDetectionResult headerResult)
    {
        if (headerResult?.WinningHeader == null) return 0;
        return headerResult.WinningHeader.Score;
    }

    private static double ComputeDensityRatio(List<List<string>> rows)
    {
        if (!rows.Any()) return 0;

        var populatedCells = rows.Sum(row => row.Count(cell => !string.IsNullOrWhiteSpace(cell)));
        var totalCells = rows.Sum(row => row.Count);
        return totalCells == 0 ? 0 : populatedCells / (double)totalCells;
    }

    private static double ComputeNumericRatio(List<List<string>> rows)
    {
        var values = rows.SelectMany(row => row).Where(cell => !string.IsNullOrWhiteSpace(cell)).ToList();
        if (!values.Any()) return 0;

        var numeric = values.Count(cell => IsNumeric(cell) || IsDateLike(cell));
        return numeric / (double)values.Count;
    }

    private static double ComputeTextRatio(List<List<string>> rows)
    {
        var values = rows.SelectMany(row => row).Where(cell => !string.IsNullOrWhiteSpace(cell)).ToList();
        if (!values.Any()) return 0;

        var text = values.Count(cell => !IsNumeric(cell) && !IsDateLike(cell));
        return text / (double)values.Count;
    }

    private static double ComputeRectangularity(List<List<string>> rows, int columnCount)
    {
        if (!rows.Any() || columnCount == 0) return 0;

        var filledCells = rows.Sum(row => row.Count(cell => !string.IsNullOrWhiteSpace(cell)));
        var capacity = rows.Count * columnCount;
        return capacity == 0 ? 0 : filledCells / (double)capacity;
    }

    private static double ComputeRepeatingStructure(List<List<string>> rows)
    {
        if (rows.Count < 2) return 0;

        var signatureCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in rows)
        {
            var signature = string.Join('|', row.Select(cell => ClassifyCellSignature(cell)));
            signatureCounts[signature] = signatureCounts.GetValueOrDefault(signature) + 1;
        }

        var repeated = signatureCounts.Values.Where(count => count > 1).Sum();
        return repeated / (double)rows.Count;
    }

    private static int CountSummaryKeywords(List<List<string>> rows)
    {
        return rows.SelectMany(row => row)
            .Count(cell => !string.IsNullOrWhiteSpace(cell) && SummaryKeywords.IsMatch(cell));
    }

    private static int CountSentenceLikeRows(List<List<string>> rows)
    {
        return rows.Count(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell) && SentenceLikeText.IsMatch(cell)));
    }

    private static int CountLongTextRows(List<List<string>> rows)
    {
        return rows.Count(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell) && cell.Trim().Length > 40));
    }

    private static string ClassifyCellSignature(string cell)
    {
        return IsNumeric(cell) || IsDateLike(cell) ? "N" : string.IsNullOrWhiteSpace(cell) ? "E" : "T";
    }

    private static bool IsNumeric(string value)
    {
        return double.TryParse(value.Trim(), out _);
    }

    private static bool IsDateLike(string value)
    {
        return DateTime.TryParse(value.Trim(), out _);
    }

    private static TableClassificationCandidate CreateCandidate(RegionType type, int score, List<string> reasons)
    {
        return new TableClassificationCandidate
        {
            RegionType = type,
            Score = Math.Clamp(score, 0, 100),
            Reasons = reasons
        };
    }

    private static List<string> BuildTabularReasons(int headerScore, int rowCount, double rectangularity, double repeatingStructure)
    {
        var reasons = new List<string>();
        if (headerScore > 0) reasons.Add("Valid header present");
        if (rowCount >= 15) reasons.Add("Many rows in the region");
        if (rectangularity >= 0.75) reasons.Add("Rectangular layout");
        if (repeatingStructure >= 0.25) reasons.Add("Repeating row structure");
        return reasons;
    }

    private static List<string> BuildStatisticsReasons(double numericRatio, double rectangularity, int rowCount, int headerScore)
    {
        var reasons = new List<string>();
        if (numericRatio >= 0.6) reasons.Add("Mostly numeric values");
        if (rectangularity >= 0.7) reasons.Add("Compact rectangular region");
        if (rowCount <= 10) reasons.Add("Small row count");
        if (headerScore > 0) reasons.Add("Valid header present");
        return reasons;
    }

    private static List<string> BuildSummaryReasons(double textRatio, int summaryKeywords, int rowCount)
    {
        var reasons = new List<string>();
        if (textRatio >= 0.6) reasons.Add("Mostly text content");
        if (summaryKeywords > 0) reasons.Add("Contains summary keywords");
        if (rowCount <= 8) reasons.Add("Few rows");
        return reasons;
    }

    private static List<string> BuildNotesReasons(int longTextRows, int sentenceRows, int columnCount)
    {
        var reasons = new List<string>();
        if (longTextRows > 0) reasons.Add("Long text entries");
        if (sentenceRows > 0) reasons.Add("Sentence-like rows present");
        if (columnCount <= 4) reasons.Add("Few columns");
        return reasons;
    }

    private static List<string> BuildMetadataReasons(int rowCount, int columnCount, double denseRatio)
    {
        var reasons = new List<string>();
        if (rowCount <= 5) reasons.Add("Few rows");
        if (columnCount <= 4) reasons.Add("Few columns");
        if (denseRatio <= 0.5) reasons.Add("Sparse layout");
        return reasons;
    }
}

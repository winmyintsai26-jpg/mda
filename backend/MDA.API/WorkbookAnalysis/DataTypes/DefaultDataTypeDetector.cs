using MDA.API.WorkbookAnalysis.Columns;

namespace MDA.API.WorkbookAnalysis.DataTypes;

public class DefaultDataTypeDetector : IDataTypeDetector
{
    private static readonly HashSet<string> BooleanTrueValues = new(StringComparer.OrdinalIgnoreCase)
    {
        "TRUE",
        "YES",
        "Y"
    };

    private static readonly HashSet<string> BooleanFalseValues = new(StringComparer.OrdinalIgnoreCase)
    {
        "FALSE",
        "NO",
        "N"
    };

    public List<DetectedColumn> Detect(List<DetectedColumn> columns)
    {
        foreach (var column in columns)
        {
            var nonEmptyValues = column.Values
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToList();

            column.Type = AnalyzeColumn(nonEmptyValues, column.EmptyValueCount);
        }

        return columns;
    }

    private static DetectedColumnType AnalyzeColumn(List<string> values, int emptyValueCount)
    {
        var type = new DetectedColumnType
        {
            IsNullable = emptyValueCount > 0,
            SampleCount = values.Count
        };

        if (!values.Any())
        {
            type.DataType = "Text";
            type.Confidence = 0;
            type.DetectedFormat = null;
            return type;
        }

        var analysis = new ColumnTypeAnalysis(values);
        type = analysis.DetermineType();
        type.IsNullable = emptyValueCount > 0;
        type.SampleCount = values.Count;

        return type;
    }

    private sealed class ColumnTypeAnalysis
    {
        private readonly List<string> _values;

        public ColumnTypeAnalysis(List<string> values)
        {
            _values = values;
        }

        public DetectedColumnType DetermineType()
        {
            var numericMatches = _values.Count(IsNumeric);
            var dateMatches = _values.Count(IsDate);
            var booleanMatches = _values.Count(IsBoolean);
            var identifierMatches = _values.Count(IsIdentifier);

            var bestMatch = new List<(string Type, int Count, string? Format)>
            {
                ("Numeric", numericMatches, null),
                ("DateTime", dateMatches, DetectDateFormat()),
                ("Boolean", booleanMatches, null),
                ("Identifier", identifierMatches, null)
            }
            .OrderByDescending(item => item.Count)
            .ThenByDescending(item => item.Type == "DateTime")
            .ThenByDescending(item => item.Type == "Numeric")
            .ThenByDescending(item => item.Type == "Boolean")
            .ToList();

            var best = bestMatch.First();
            var confidence = (int)Math.Round((best.Count / (double)_values.Count) * 100);

            return new DetectedColumnType
            {
                DataType = best.Type,
                Confidence = confidence,
                DetectedFormat = best.Type == "DateTime" ? best.Format : null
            };
        }

        private string? DetectDateFormat()
        {
            var formats = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                { "MM/dd/yyyy", 0 },
                { "M/d/yyyy", 0 },
                { "MM/dd/yyyy HH:mm", 0 },
                { "M/d/yyyy h:mm tt", 0 },
                { "yyyy-MM-dd", 0 },
                { "yyyy-M-d", 0 },
                { "yyyy-MM-dd HH:mm", 0 },
                { "yyyy-M-d H:mm", 0 }
            };

            foreach (var value in _values)
            {
                foreach (var format in formats.Keys.ToList())
                {
                    if (DateTime.TryParseExact(value, format, null, System.Globalization.DateTimeStyles.None, out _))
                    {
                        formats[format]++;
                    }
                }
            }

            var best = formats.OrderByDescending(pair => pair.Value).FirstOrDefault();
            return best.Value > 0 ? best.Key : null;
        }

        private static bool IsBoolean(string value)
        {
            return BooleanTrueValues.Contains(value.Trim()) || BooleanFalseValues.Contains(value.Trim());
        }

        private static bool IsNumeric(string value)
        {
            return double.TryParse(value.Trim(), out _);
        }

        private static bool IsDate(string value)
        {
            return DateTime.TryParse(value.Trim(), out _);
        }

        private static bool IsIdentifier(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            if (IsNumeric(value) || IsDate(value) || IsBoolean(value))
            {
                return false;
            }

            var hasLetter = value.Any(char.IsLetter);
            var hasDigit = value.Any(char.IsDigit);
            var hasDash = value.Contains('-');

            if (!hasLetter || !hasDigit)
            {
                return false;
            }

            var uniqueParts = value.Replace("-", string.Empty);
            return uniqueParts.Length >= 2;
        }
    }
}

namespace MDA.API.Database;

internal static class MySqlImportPreflightValidator
{
    public static (List<(string PreviewHeader, MySqlSchemaColumn SchemaColumn, int Index)> MatchedColumns, List<string> IgnoredPreviewColumns) BuildImportPlan(
        IReadOnlyList<string> headers,
        IReadOnlyList<MySqlSchemaColumn> schema)
    {
        ValidateSchemaNormalizationCollisions(schema);
        ValidatePreviewHeaderNormalizationCollisions(headers);

        var schemaByNormalizedName = schema
            .Select(column => new
            {
                Column = column,
                Normalized = HeaderNormalizer.Normalize(column.ColumnName)
            })
            .Where(entry => !string.IsNullOrEmpty(entry.Normalized))
            .ToDictionary(entry => entry.Normalized, entry => entry.Column, StringComparer.Ordinal);

        var matchedColumns = new List<(string PreviewHeader, MySqlSchemaColumn SchemaColumn, int Index)>();
        var ignoredPreviewColumns = new List<string>();

        for (var index = 0; index < headers.Count; index++)
        {
            var previewHeader = headers[index]?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(previewHeader))
            {
                ignoredPreviewColumns.Add(previewHeader);
                continue;
            }

            var normalizedPreviewHeader = HeaderNormalizer.Normalize(previewHeader);
            if (!string.IsNullOrEmpty(normalizedPreviewHeader)
                && schemaByNormalizedName.TryGetValue(normalizedPreviewHeader, out var schemaColumn))
            {
                matchedColumns.Add((previewHeader, schemaColumn, index));
            }
            else
            {
                ignoredPreviewColumns.Add(previewHeader);
            }
        }

        ValidateRequiredDestinationColumns(schema, matchedColumns);

        return (matchedColumns, ignoredPreviewColumns);
    }

    private static void ValidateSchemaNormalizationCollisions(IReadOnlyList<MySqlSchemaColumn> schema)
    {
        var collisions = schema
            .Where(column => !string.IsNullOrWhiteSpace(column.ColumnName))
            .GroupBy(column => HeaderNormalizer.Normalize(column.ColumnName), StringComparer.Ordinal)
            .Where(group => !string.IsNullOrEmpty(group.Key) && group.Select(column => column.ColumnName).Distinct(StringComparer.OrdinalIgnoreCase).Count() > 1)
            .Select(group => $"{group.Key}: {string.Join(", ", group.Select(column => column.ColumnName))}")
            .ToList();

        if (collisions.Count == 0)
        {
            return;
        }

        throw new MySqlImportValidationException(
            "Import mapping is ambiguous because destination columns normalize to the same key. "
            + "Resolve these destination column names first: "
            + string.Join(" | ", collisions));
    }

    private static void ValidatePreviewHeaderNormalizationCollisions(IReadOnlyList<string> headers)
    {
        var collisions = headers
            .Select((header, index) => new
            {
                Original = header?.Trim() ?? string.Empty,
                Index = index + 1,
                Normalized = HeaderNormalizer.Normalize(header)
            })
            .Where(entry => !string.IsNullOrWhiteSpace(entry.Original) && !string.IsNullOrEmpty(entry.Normalized))
            .GroupBy(entry => entry.Normalized, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => $"{group.Key}: {string.Join(", ", group.Select(entry => $"'{entry.Original}' (column {entry.Index})"))}")
            .ToList();

        if (collisions.Count == 0)
        {
            return;
        }

        throw new MySqlImportValidationException(
            "Import mapping is ambiguous because multiple preview headers normalize to the same key. "
            + "Rename the colliding preview headers before importing: "
            + string.Join(" | ", collisions));
    }

    private static void ValidateRequiredDestinationColumns(
        IReadOnlyList<MySqlSchemaColumn> schema,
        IReadOnlyList<(string PreviewHeader, MySqlSchemaColumn SchemaColumn, int Index)> matchedColumns)
    {
        var matchedColumnNames = matchedColumns
            .Select(column => column.SchemaColumn.ColumnName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var missingRequiredColumns = schema
            .Where(column => !column.Nullable && !column.AutoIncrement && string.IsNullOrWhiteSpace(column.DefaultValue))
            .Where(column => !matchedColumnNames.Contains(column.ColumnName))
            .Select(column => column.ColumnName)
            .ToList();

        if (missingRequiredColumns.Count == 0)
        {
            return;
        }

        throw new MySqlImportValidationException(
            "Import cannot start because required destination columns are missing from the mapping: "
            + string.Join(", ", missingRequiredColumns)
            + ". Add these columns to Preview or select a compatible destination table.");
    }
}

using MySqlConnector;

namespace MDA.API.Database;

public sealed class MySqlImportService
{
    private readonly MySqlConnectionService _connectionService;
    private readonly MySqlSchemaService _schemaService;

    public MySqlImportService(MySqlConnectionService connectionService, MySqlSchemaService schemaService)
    {
        _connectionService = connectionService;
        _schemaService = schemaService;
    }

    public async Task<MySqlImportResult> ImportAsync(MySqlImportRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Headers.Count == 0)
        {
            throw new InvalidOperationException("Preview table has no columns to import.");
        }

        if (request.Rows.Count == 0)
        {
            return new MySqlImportResult();
        }

        var schema = await _schemaService.GetTableSchemaAsync(request, cancellationToken);

        // Preflight validation happens before opening a connection/transaction.
        // This guarantees required/mapping errors fail fast and never execute SQL.
        var importPlan = MySqlImportPreflightValidator.BuildImportPlan(request.Headers, schema);
        var matchedColumns = importPlan.MatchedColumns;
        var ignoredPreviewColumns = importPlan.IgnoredPreviewColumns;

        if (matchedColumns.Count == 0)
        {
            throw new MySqlImportValidationException("No preview columns match the selected MySQL table schema.");
        }

        var escapedTableName = EscapeIdentifier(request.Table);
        var escapedColumns = string.Join(", ", matchedColumns.Select(column => EscapeIdentifier(column.SchemaColumn.ColumnName)));
        var parameterNames = matchedColumns.Select((_, index) => $"@p{index}").ToList();
        var insertSql = $"INSERT INTO {escapedTableName} ({escapedColumns}) VALUES ({string.Join(", ", parameterNames)});";

        await using var connection = await _connectionService.OpenConnectionAsync(request, request.Database, cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new MySqlCommand(insertSql, connection, transaction);

        foreach (var parameterName in parameterNames)
        {
            command.Parameters.Add(new MySqlParameter(parameterName, DBNull.Value));
        }

        var insertedRowCount = 0;
        foreach (var row in request.Rows)
        {
            for (var parameterIndex = 0; parameterIndex < matchedColumns.Count; parameterIndex++)
            {
                var column = matchedColumns[parameterIndex];
                var rawValue = column.Index < row.Count ? row[column.Index] : string.Empty;
                command.Parameters[parameterIndex].Value = NormalizeImportValue(rawValue, column.SchemaColumn);
            }

            await command.ExecuteNonQueryAsync(cancellationToken);
            insertedRowCount++;
        }

        await transaction.CommitAsync(cancellationToken);

        return new MySqlImportResult
        {
            InsertedRowCount = insertedRowCount,
            MatchedColumns = matchedColumns.Select(column => column.SchemaColumn.ColumnName).ToList(),
            IgnoredPreviewColumns = ignoredPreviewColumns.Where(column => !string.IsNullOrWhiteSpace(column)).Distinct(StringComparer.OrdinalIgnoreCase).ToList()
        };
    }

    private static object NormalizeImportValue(string? rawValue, MySqlSchemaColumn schemaColumn)
    {
        if (rawValue is null)
        {
            if (schemaColumn.Nullable || schemaColumn.AutoIncrement)
            {
                return DBNull.Value;
            }

            return string.Empty;
        }

        if (IsTextColumn(schemaColumn))
        {
            return rawValue;
        }

        if (string.IsNullOrWhiteSpace(rawValue))
        {
            if (schemaColumn.Nullable || schemaColumn.AutoIncrement)
            {
                return DBNull.Value;
            }

            return string.Empty;
        }

        var trimmed = rawValue.Trim();

        if (IsBooleanColumn(schemaColumn) && TryNormalizeBoolean(trimmed, out var booleanValue))
        {
            return booleanValue;
        }

        return trimmed;
    }

    private static bool IsTextColumn(MySqlSchemaColumn schemaColumn)
    {
        return schemaColumn.DataType.ToLowerInvariant() switch
        {
            "char" => true,
            "varchar" => true,
            "tinytext" => true,
            "text" => true,
            "mediumtext" => true,
            "longtext" => true,
            _ => false
        };
    }

    private static bool IsBooleanColumn(MySqlSchemaColumn schemaColumn)
    {
        var dataType = schemaColumn.DataType.Trim().ToLowerInvariant();
        var columnType = schemaColumn.ColumnType.Trim().ToLowerInvariant();

        if (dataType is "bool" or "boolean")
        {
            return true;
        }

        return dataType == "tinyint" && columnType == "tinyint(1)";
    }

    private static bool TryNormalizeBoolean(string value, out bool normalized)
    {
        switch (value.ToUpperInvariant())
        {
            case "TRUE":
            case "YES":
            case "Y":
            case "1":
                normalized = true;
                return true;
            case "FALSE":
            case "NO":
            case "N":
            case "0":
                normalized = false;
                return true;
            default:
                normalized = false;
                return false;
        }
    }

    private static string EscapeIdentifier(string identifier)
    {
        return $"`{identifier.Replace("`", "``", StringComparison.Ordinal)}`";
    }
}

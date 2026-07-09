using MySqlConnector;

namespace MDA.API.Database;

public sealed class MySqlSchemaService
{
    private readonly MySqlConnectionService _connectionService;

    public MySqlSchemaService(MySqlConnectionService connectionService)
    {
        _connectionService = connectionService;
    }

    public async Task<List<string>> ListDatabasesAsync(MySqlConnectionRequest request, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT SCHEMA_NAME
            FROM INFORMATION_SCHEMA.SCHEMATA
            ORDER BY SCHEMA_NAME;";

        await using var connection = await _connectionService.OpenConnectionAsync(request, cancellationToken: cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var databases = new List<string>();
        while (await reader.ReadAsync(cancellationToken))
        {
            databases.Add(reader.GetString(0));
        }

        return databases;
    }

    public async Task<List<string>> ListTablesAsync(MySqlDatabaseRequest request, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = @schemaName
              AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME;";

        await using var connection = await _connectionService.OpenConnectionAsync(request, request.Database, cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@schemaName", request.Database);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var tables = new List<string>();
        while (await reader.ReadAsync(cancellationToken))
        {
            tables.Add(reader.GetString(0));
        }

        return tables;
    }

    public async Task<List<MySqlSchemaColumn>> GetTableSchemaAsync(MySqlTableRequest request, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COLUMN_NAME,
                   DATA_TYPE,
                 COLUMN_TYPE,
                   IS_NULLABLE,
                   COLUMN_DEFAULT,
                   EXTRA
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @schemaName
              AND TABLE_NAME = @tableName
            ORDER BY ORDINAL_POSITION;";

        await using var connection = await _connectionService.OpenConnectionAsync(request, request.Database, cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@schemaName", request.Database);
        command.Parameters.AddWithValue("@tableName", request.Table);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var columns = new List<MySqlSchemaColumn>();
        while (await reader.ReadAsync(cancellationToken))
        {
            var extra = reader.IsDBNull(5) ? string.Empty : reader.GetString(5);
            columns.Add(new MySqlSchemaColumn
            {
                ColumnName = reader.GetString(0),
                DataType = reader.GetString(1),
                ColumnType = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                Nullable = string.Equals(reader.GetString(3), "YES", StringComparison.OrdinalIgnoreCase),
                DefaultValue = reader.IsDBNull(4) ? null : reader.GetValue(4)?.ToString(),
                AutoIncrement = extra.Contains("auto_increment", StringComparison.OrdinalIgnoreCase)
            });
        }

        return columns;
    }
}

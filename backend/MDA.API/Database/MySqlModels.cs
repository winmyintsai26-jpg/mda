namespace MDA.API.Database;

public class MySqlConnectionRequest
{
    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 3306;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class MySqlDatabaseRequest : MySqlConnectionRequest
{
    public string Database { get; set; } = string.Empty;
}

public class MySqlTableRequest : MySqlDatabaseRequest
{
    public string Table { get; set; } = string.Empty;
}

public sealed class MySqlSchemaColumn
{
    public string ColumnName { get; set; } = string.Empty;

    public string DataType { get; set; } = string.Empty;

    public string ColumnType { get; set; } = string.Empty;

    public bool Nullable { get; set; }

    public string? DefaultValue { get; set; }

    public bool AutoIncrement { get; set; }
}

public sealed class MySqlConnectionTestResult
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;
}

public sealed class MySqlImportRequest : MySqlTableRequest
{
    public List<string> Headers { get; set; } = new();

    public List<List<string>> Rows { get; set; } = new();
}

public sealed class MySqlImportResult
{
    public int InsertedRowCount { get; set; }

    public List<string> MatchedColumns { get; set; } = new();

    public List<string> IgnoredPreviewColumns { get; set; } = new();
}

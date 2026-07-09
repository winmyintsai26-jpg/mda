using MySqlConnector;

namespace MDA.API.Database;

public sealed class MySqlConnectionService
{
    public string BuildConnectionString(MySqlConnectionRequest request, string? database = null)
    {
        var builder = new MySqlConnectionStringBuilder
        {
            Server = request.Host,
            Port = (uint)(request.Port <= 0 ? 3306 : request.Port),
            UserID = request.Username,
            Password = request.Password,
            Database = database ?? string.Empty,
            SslMode = MySqlSslMode.Preferred,
            AllowUserVariables = true
        };

        return builder.ConnectionString;
    }

    public async Task<MySqlConnectionTestResult> TestConnectionAsync(MySqlConnectionRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(BuildConnectionString(request));
            await connection.OpenAsync(cancellationToken);
            await connection.CloseAsync();

            return new MySqlConnectionTestResult
            {
                Success = true,
                Message = "Connection successful."
            };
        }
        catch (Exception ex)
        {
            return new MySqlConnectionTestResult
            {
                Success = false,
                Message = ex.Message
            };
        }
    }

    public async Task<MySqlConnection> OpenConnectionAsync(MySqlConnectionRequest request, string? database = null, CancellationToken cancellationToken = default)
    {
        var connection = new MySqlConnection(BuildConnectionString(request, database));
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}

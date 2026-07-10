namespace MDA.API.Database;

public sealed class MySqlImportValidationException : Exception
{
    public MySqlImportValidationException(string message)
        : base(message)
    {
    }
}

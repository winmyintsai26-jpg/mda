using MDA.API.Database;

namespace MDA.API.Tests.Database;

public class MySqlImportPreflightValidatorTests
{
    [Fact]
    public void BuildImportPlan_ThrowsWhenPreviewHeadersNormalizeToSameValue()
    {
        var headers = new List<string> { "Part-No", "Part No" };
        var schema = new List<MySqlSchemaColumn>
        {
            new() { ColumnName = "PartNo", Nullable = true, AutoIncrement = false }
        };

        var exception = Assert.Throws<MySqlImportValidationException>(() =>
            MySqlImportPreflightValidator.BuildImportPlan(headers, schema));

        Assert.Contains("multiple preview headers normalize", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BuildImportPlan_ThrowsWhenRequiredDestinationColumnsAreMissing()
    {
        var headers = new List<string> { "Optional Column" };
        var schema = new List<MySqlSchemaColumn>
        {
            new() { ColumnName = "Id", Nullable = false, AutoIncrement = true, DefaultValue = null },
            new() { ColumnName = "OrderNo", Nullable = false, AutoIncrement = false, DefaultValue = null },
            new() { ColumnName = "OptionalColumn", Nullable = true, AutoIncrement = false, DefaultValue = null }
        };

        var exception = Assert.Throws<MySqlImportValidationException>(() =>
            MySqlImportPreflightValidator.BuildImportPlan(headers, schema));

        Assert.Contains("required destination columns", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("OrderNo", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BuildImportPlan_MatchesNormalizedHeadersWithoutCollisions()
    {
        var headers = new List<string> { "ORDER NO", "Ship Qty(LB)", "Ignored" };
        var schema = new List<MySqlSchemaColumn>
        {
            new() { ColumnName = "OrderNo", Nullable = false, AutoIncrement = false, DefaultValue = "N/A" },
            new() { ColumnName = "ShipQtyLB", Nullable = true, AutoIncrement = false }
        };

        var plan = MySqlImportPreflightValidator.BuildImportPlan(headers, schema);

        Assert.Equal(2, plan.MatchedColumns.Count);
        Assert.Contains(plan.MatchedColumns, column => string.Equals(column.SchemaColumn.ColumnName, "OrderNo", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(plan.MatchedColumns, column => string.Equals(column.SchemaColumn.ColumnName, "ShipQtyLB", StringComparison.OrdinalIgnoreCase));
        Assert.Single(plan.IgnoredPreviewColumns);
    }
}

using MDA.API.Database;

namespace MDA.API.Tests.Database;

public class HeaderNormalizerTests
{
    [Theory]
    [InlineData("ORDER NO", "ORDERNO")]
    [InlineData("Updated date", "UPDATEDDATE")]
    [InlineData("Ship Qty(LB)", "SHIPQTYLB")]
    [InlineData("Customer PO", "CUSTOMERPO")]
    [InlineData("D/E", "DE")]
    [InlineData("Part_No", "PARTNO")]
    public void Normalize_RemovesFormattingAndUppercases(string input, string expected)
    {
        var normalized = HeaderNormalizer.Normalize(input);

        Assert.Equal(expected, normalized);
    }
}

using MDA.API.WorkbookAnalysis.Columns;
using MDA.API.WorkbookAnalysis.DataTypes;

namespace MDA.API.Tests.WorkbookAnalysis;

public class DefaultDataTypeDetectorTests
{
    [Fact]
    public void Detect_IdentifiesNumericColumn()
    {
        var detector = new DefaultDataTypeDetector();
        var columns = new List<DetectedColumn>
        {
            new()
            {
                Header = "Amount",
                Values = new List<string> { "10", "20.5", "-3" },
                EmptyValueCount = 0
            }
        };

        var detected = detector.Detect(columns);

        Assert.Single(detected);
        Assert.NotNull(detected[0].Type);
        Assert.Equal("Numeric", detected[0].Type!.DataType);
    }

    [Fact]
    public void Detect_IdentifiesDateTimeColumn()
    {
        var detector = new DefaultDataTypeDetector();
        var columns = new List<DetectedColumn>
        {
            new()
            {
                Header = "UpdatedDate",
                Values = new List<string> { "2026-07-10", "2026-07-11", "2026-07-12" },
                EmptyValueCount = 0
            }
        };

        var detected = detector.Detect(columns);

        Assert.Single(detected);
        Assert.NotNull(detected[0].Type);
        Assert.Equal("DateTime", detected[0].Type!.DataType);
    }
}

using MDA.API.WorkbookAnalysis;
using MDA.API.WorkbookAnalysis.Models;

namespace MDA.API.Tests.WorkbookAnalysis;

public class RegionRowsTests
{
    [Fact]
    public void RemoveRepeatedHeaderRows_RemovesDuplicatedHeaderRowsFromDataSection()
    {
        var region = new CandidateRegion
        {
            Rows = new List<List<string>>
            {
                new() { "Order No", "Qty" },
                new() { "Order No", "Qty" },
                new() { "A100", "10" }
            },
            HeaderDetectionResult = new HeaderDetectionResult
            {
                WinningHeader = new HeaderCandidate
                {
                    HeaderStartRowRelative = 0,
                    HeaderCells = new List<List<string>>
                    {
                        new() { "Order No", "Qty" }
                    }
                }
            }
        };

        RegionRows.RemoveRepeatedHeaderRows(region);

        Assert.Single(region.Rows);
        Assert.Equal("A100", region.Rows[0][0]);
        Assert.Equal("10", region.Rows[0][1]);
    }
}

namespace MDA.API.WorkbookAnalysis.Models;

public class HeaderCandidate
{
    public int HeaderStartRow { get; set; }

    public int HeaderEndRow { get; set; }

    public int HeaderStartRowRelative { get; set; }

    public int HeaderEndRowRelative { get; set; }

    public List<List<string>> HeaderCells { get; set; } = new();

    public int Score { get; set; }

    public ScoreBreakdown Breakdown { get; set; } = new();

    public List<string> Reasons { get; set; } = new();
}

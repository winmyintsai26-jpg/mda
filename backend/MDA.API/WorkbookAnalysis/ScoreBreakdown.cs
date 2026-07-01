namespace MDA.API.WorkbookAnalysis.Models;

public class ScoreBreakdown
{
    public int TextScore { get; set; }

    public int DensityScore { get; set; }

    public int LabelScore { get; set; }

    public int UniquenessScore { get; set; }

    public int PositionScore { get; set; }

    public int DataConsistencyScore { get; set; }

    public int TypeContrastScore { get; set; }

    public int Total => TextScore + DensityScore + LabelScore + UniquenessScore + DataConsistencyScore + PositionScore + TypeContrastScore;
}

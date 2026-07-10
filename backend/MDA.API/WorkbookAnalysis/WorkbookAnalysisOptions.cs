namespace MDA.API.WorkbookAnalysis;

public class WorkbookAnalysisOptions
{
    public int MaxBlankRows { get; set; } = 1;

    public int MaxBlankColumns { get; set; } = 1;

    public int MaxHeaderRows { get; set; } = 3;

    public int HeaderSearchDepth { get; set; } = 8;

    public int InitialValidationConfidence { get; set; } = 100;

    public int ValidConfidenceThreshold { get; set; } = 70;
}

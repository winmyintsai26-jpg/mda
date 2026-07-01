public class RowProfile
{
    public int RowNumber { get; set; }

    public bool IsBlank { get; set; }

    public int PopulatedCells { get; set; }

    public int FirstColumn { get; set; }

    public int LastColumn { get; set; }

    public int Width { get; set; }          // LastColumn - FirstColumn + 1

    public bool HasMergedCells { get; set; }

    public bool IsHidden { get; set; }
}
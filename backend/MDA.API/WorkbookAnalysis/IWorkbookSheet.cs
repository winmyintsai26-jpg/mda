namespace MDA.API.WorkbookAnalysis;

public interface IWorkbookSheet
{
    string Name { get; }

    int RowCount { get; }

    int ColumnCount { get; }

    string GetCellValue(int row, int column);
}

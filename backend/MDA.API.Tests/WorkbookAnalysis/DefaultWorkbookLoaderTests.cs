using ClosedXML.Excel;
using MDA.API.WorkbookAnalysis;
using NPOI.HSSF.UserModel;

namespace MDA.API.Tests.WorkbookAnalysis;

public class DefaultWorkbookLoaderTests
{
    [Fact]
    public async Task LoadAsync_LoadsXlsxWorkbook()
    {
        using var stream = new MemoryStream();
        using (var workbook = new XLWorkbook())
        {
            var sheet = workbook.Worksheets.Add("Sheet1");
            sheet.Cell(1, 1).Value = "OrderNo";
            sheet.Cell(2, 1).Value = "A100";
            workbook.SaveAs(stream);
        }

        stream.Position = 0;
        var loader = new DefaultWorkbookLoader();

        var result = await loader.LoadAsync(stream, "sample.xlsx");

        Assert.True(result.Success);
        Assert.NotNull(result.Workbook);
        Assert.Equal("xlsx", result.DetectedFormat);
        Assert.NotEmpty(result.Workbook!.Worksheets);
    }

    [Fact]
    public async Task LoadAsync_LoadsXlsWorkbook()
    {
        using var stream = new MemoryStream();
        var workbook = new HSSFWorkbook();
        var sheet = workbook.CreateSheet("Sheet1");
        var row = sheet.CreateRow(0);
        row.CreateCell(0).SetCellValue("OrderNo");
        workbook.Write(stream, leaveOpen: true);

        stream.Position = 0;
        var loader = new DefaultWorkbookLoader();

        var result = await loader.LoadAsync(stream, "sample.xls");

        Assert.True(result.Success);
        Assert.NotNull(result.Workbook);
        Assert.Equal("xls", result.DetectedFormat);
        Assert.NotEmpty(result.Workbook!.Worksheets);
    }
}

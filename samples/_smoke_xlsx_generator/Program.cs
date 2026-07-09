using ClosedXML.Excel;

var outputPath = args.Length > 0 ? args[0] : throw new InvalidOperationException("Output path is required.");
Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);

using var workbook = new XLWorkbook();
var sheet = workbook.Worksheets.Add("Sheet1");
sheet.Cell("A1").Value = "Order Date";
sheet.Cell("B1").Value = "Amount";
sheet.Cell("A2").Value = "7/9/26";
sheet.Cell("B2").Value = "1,250";
sheet.Cell("A3").Value = "Jul 9, 2026";
sheet.Cell("B3").Value = "(2,500.50)";
workbook.SaveAs(outputPath);
Console.WriteLine(outputPath);

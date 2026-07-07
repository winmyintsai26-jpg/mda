function clone(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function getTableTitle(rows, headers, worksheetName, regionIndex) {
    const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
    const titleCandidates = [...firstRow, ...headers];

    const detectedTitle = titleCandidates.find((value) => typeof value === "string" && value.trim());

    if (detectedTitle) {
        return detectedTitle;
    }

    return `${worksheetName} Table ${regionIndex + 1}`;
}

export function createPreviewTablesFromAnalysis(analysisResult) {
    const worksheets = Array.isArray(analysisResult?.worksheets) ? analysisResult.worksheets : [];

    return worksheets.flatMap((worksheet, worksheetIndex) => {
        const regions = Array.isArray(worksheet?.candidateRegions) ? worksheet.candidateRegions : [];

        return regions.map((region, regionIndex) => {
            const rows = Array.isArray(region?.rows) ? region.rows.map((row) => [...(Array.isArray(row) ? row : [])]) : [];
            const headerRows = Array.isArray(region?.headerDetectionResult?.winningHeader?.headerCells)
                ? region.headerDetectionResult.winningHeader.headerCells
                : [];
            const headerRow = headerRows.length > 0 ? headerRows[headerRows.length - 1] : [];
            const headers = Array.isArray(headerRow) && headerRow.length > 0
                ? headerRow.map((name, index) => ({ id: `${worksheetIndex}-${regionIndex}-col-${index}`, name: name ?? "" }))
                : rows[0]?.map((_, index) => ({ id: `${worksheetIndex}-${regionIndex}-col-${index}`, name: `Column ${index + 1}` })) || [];

            return {
                id: `${worksheetIndex}-${regionIndex}`,
                worksheetName: worksheet?.sheetName || `Worksheet ${worksheetIndex + 1}`,
                title: getTableTitle(rows, headerRow, worksheet?.sheetName || `Worksheet ${worksheetIndex + 1}`, regionIndex),
                source: clone(region),
                headers,
                rows,
                validation: {
                    isValid: region?.tableValidation?.isValid ?? false,
                    confidence: region?.tableValidation?.confidence ?? 0,
                    issues: Array.isArray(region?.tableValidation?.issues) ? region.tableValidation.issues : [],
                    warnings: Array.isArray(region?.tableValidation?.warnings) ? region.tableValidation.warnings : []
                }
            };
        });
    });
}

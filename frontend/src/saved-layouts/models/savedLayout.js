export const SAVED_LAYOUT_SCHEMA_VERSION = 1;

const unique = (values) => [...new Set(values.filter(Boolean))];

const normalizePatternPart = (value) => String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/[^a-z#]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `layout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getWorkbookPattern = (fileName, worksheetNames, analysisTables) => {
    const lastDotIndex = fileName.lastIndexOf(".");
    const extension = lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
    const baseName = lastDotIndex >= 0 ? fileName.slice(0, lastDotIndex) : fileName;
    const headerSignature = analysisTables
        .flatMap((candidate) => candidate.headers || [])
        .map((header) => normalizePatternPart(header.name))
        .filter(Boolean)
        .join("|");

    return {
        originalFileName: fileName,
        normalizedBaseName: normalizePatternPart(baseName),
        extension,
        worksheetSignature: worksheetNames.map(normalizePatternPart).join("|"),
        headerSignature
    };
};

const getTableRegions = (analysisTables) => analysisTables.map((candidate) => {
    const source = candidate.source || {};
    const winningHeader = source.headerDetectionResult?.winningHeader || {};

    return {
        tableId: candidate.id ?? null,
        worksheetName: candidate.worksheetName || "",
        title: candidate.title || "",
        region: {
            startRow: source.startRow ?? null,
            endRow: source.endRow ?? null,
            startColumn: source.startColumn ?? null,
            endColumn: source.endColumn ?? null
        },
        headerRow: {
            startRow: winningHeader.headerStartRow ?? null,
            endRow: winningHeader.headerEndRow ?? null,
            relativeStartRow: winningHeader.headerStartRowRelative ?? null,
            relativeEndRow: winningHeader.headerEndRowRelative ?? null,
            cells: Array.isArray(winningHeader.headerCells) ? winningHeader.headerCells : []
        }
    };
});

const getColumnConfiguration = (table, selectedAnalysisTable, columnMappings) => {
    const originalHeaders = Array.isArray(selectedAnalysisTable?.headers) ? selectedAnalysisTable.headers : [];
    const currentHeaders = Array.isArray(table?.headers) ? table.headers : [];
    const currentRows = Array.isArray(table?.rows) ? table.rows : [];
    const originalById = new Map(originalHeaders.map((header) => [header.id, header]));
    const currentIds = new Set(currentHeaders.map((header) => header.id));

    const columns = currentHeaders.map((header, index) => {
        const original = originalById.get(header.id);

        return {
            id: header.id ?? null,
            order: index,
            name: header.name || "",
            dataType: header.dataType || "Text",
            sourceName: original?.name ?? null,
            changeType: !original ? "added" : original.name !== header.name ? "renamed" : "unchanged"
        };
    });

    return {
        columns,
        columnMappings: columnMappings.map((mapping) => ({
            sourceColumn: mapping.previewColumn,
            destinationColumn: mapping.databaseColumn,
            destinationType: mapping.dataType
        })),
        renamedColumns: columns
            .filter((column) => column.changeType === "renamed")
            .map((column) => ({ id: column.id, from: column.sourceName, to: column.name })),
        deletedColumns: originalHeaders
            .map((header, order) => ({ ...header, order }))
            .filter((header) => !currentIds.has(header.id))
            .map((header) => ({ id: header.id ?? null, name: header.name || "", dataType: header.dataType || "Text", order: header.order })),
        addedColumns: columns
            .filter((column) => column.changeType === "added")
            .map((column) => {
                const values = currentRows.map((row) => row?.[column.order] ?? "");
                const firstValue = values[0] ?? "";
                const hasConsistentDefault = values.every((value) => String(value ?? "") === String(firstValue ?? ""));

                return {
                    id: column.id,
                    name: column.name,
                    dataType: column.dataType,
                    order: column.order,
                    defaultValue: hasConsistentDefault ? firstValue : ""
                };
            })
    };
};

export function createSavedLayout({
    name,
    fileName,
    analysisTables,
    table,
    selectedAnalysisTable,
    selectedWorksheet,
    columnMappings,
    destination
}) {
    const timestamp = new Date().toISOString();
    const worksheetNames = unique(analysisTables.map((candidate) => candidate.worksheetName));

    return {
        id: createId(),
        schemaVersion: SAVED_LAYOUT_SCHEMA_VERSION,
        name: name.trim(),
        workbookPattern: getWorkbookPattern(fileName, worksheetNames, analysisTables),
        worksheetNames,
        tableRegions: getTableRegions(analysisTables),
        activeWorksheet: selectedWorksheet || "",
        activeTable: {
            id: selectedAnalysisTable?.id ?? null,
            title: table?.title || selectedAnalysisTable?.title || ""
        },
        columnConfiguration: getColumnConfiguration(table, selectedAnalysisTable, columnMappings),
        validationConfiguration: {
            mode: "detected-table-validation",
            isValid: selectedAnalysisTable?.validation?.isValid ?? false,
            accuracy: selectedAnalysisTable?.validation?.confidence ?? 0,
            issues: selectedAnalysisTable?.validation?.issues || [],
            warnings: selectedAnalysisTable?.validation?.warnings || []
        },
        importDestination: {
            provider: destination.provider,
            database: destination.database,
            table: destination.table
        },
        createdAt: timestamp,
        lastUsedAt: timestamp
    };
}

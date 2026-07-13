import { createSourceRowSignature, createSourceRowSignatures } from "./rowIdentity.js";

export const SAVED_LAYOUT_SCHEMA_VERSION = 3;
export const PREVIEW_STATE_VERSION = 1;

const unique = (values) => [...new Set(values.filter(Boolean))];

const normalizePatternPart = (value) => String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/[^a-z#]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeColumnIdentity = (value) => String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const createSourceColumnSnapshots = (headers) => {
    const occurrenceByName = new Map();

    return headers.map((header, order) => {
        const normalizedName = normalizeColumnIdentity(header.name);
        const occurrence = occurrenceByName.get(normalizedName) || 0;
        occurrenceByName.set(normalizedName, occurrence + 1);

        return {
            id: header.id ?? null,
            name: header.name || "",
            dataType: header.dataType || "Text",
            order,
            normalizedName,
            occurrence
        };
    });
};

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
    const currentIdentityKeys = new Set(createSourceColumnSnapshots(currentHeaders)
        .map((column) => `${column.normalizedName}:${column.occurrence}`));
    const sourceColumns = createSourceColumnSnapshots(originalHeaders).map((column) => ({
        ...column,
        visibility: column.id != null
            ? (currentIds.has(column.id) ? "visible" : "deleted")
            : (currentIdentityKeys.has(`${column.normalizedName}:${column.occurrence}`) ? "visible" : "deleted")
    }));

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
        sourceColumns,
        columnMappings: columnMappings.map((mapping) => ({
            sourceColumn: mapping.previewColumn,
            destinationColumn: mapping.databaseColumn,
            destinationType: mapping.dataType
        })),
        renamedColumns: columns
            .filter((column) => column.changeType === "renamed")
            .map((column) => ({ id: column.id, from: column.sourceName, to: column.name })),
        deletedColumns: sourceColumns
            .filter((column) => column.visibility === "deleted")
            .map((column) => ({
                id: column.id,
                name: column.name,
                dataType: column.dataType,
                order: column.order,
                normalizedName: column.normalizedName,
                occurrence: column.occurrence,
                visibility: column.visibility
            })),
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

const createFinalColumnSnapshot = (table, selectedAnalysisTable, columnConfiguration) => {
    const originalHeaders = Array.isArray(selectedAnalysisTable?.headers) ? selectedAnalysisTable.headers : [];
    const originalSnapshots = createSourceColumnSnapshots(originalHeaders);
    const originalById = new Map(originalSnapshots.map((column) => [column.id, column]));
    const addedById = new Map((columnConfiguration.addedColumns || []).map((column) => [column.id, column]));
    const widths = table?.previewState?.columnWidths || {};

    return (columnConfiguration.columns || []).map((column) => {
        const original = originalById.get(column.id);
        const added = addedById.get(column.id);

        return {
            id: column.id,
            sourceId: original?.id ?? null,
            sourceName: original?.name ?? column.sourceName ?? null,
            sourceOrder: original?.order ?? null,
            sourceOccurrence: original?.occurrence ?? null,
            name: column.name,
            dataType: column.dataType,
            order: column.order,
            kind: added ? "added" : "source",
            defaultValue: added?.defaultValue ?? "",
            width: Number.isFinite(widths[column.id]) ? widths[column.id] : null
        };
    });
};

const projectSourceRow = (sourceRow, columns) => columns.map((column) =>
    column.kind === "added"
        ? column.defaultValue ?? ""
        : sourceRow?.[column.sourceOrder] ?? ""
);

const getRowExclusions = (table, selectedAnalysisTable, columns) => {
    const sourceRows = Array.isArray(selectedAnalysisTable?.rows) ? selectedAnalysisTable.rows : [];
    const finalRows = Array.isArray(table?.rows) ? table.rows : [];
    const sourceSignatures = createSourceRowSignatures(sourceRows);
    const retainedSourceSignatures = Array.isArray(table?.sourceRowSignatures)
        && table.sourceRowSignatures.length === finalRows.length
        ? table.sourceRowSignatures
        : null;
    const remainingRows = new Map();

    (retainedSourceSignatures || finalRows.map(createSourceRowSignature)).forEach((signature) => {
        remainingRows.set(signature, (remainingRows.get(signature) || 0) + 1);
    });

    const excludedCounts = new Map();
    sourceRows.forEach((sourceRow, rowIndex) => {
        const comparisonSignature = retainedSourceSignatures
            ? sourceSignatures[rowIndex]
            : createSourceRowSignature(projectSourceRow(sourceRow, columns));
        const available = remainingRows.get(comparisonSignature) || 0;

        if (available > 0) {
            remainingRows.set(comparisonSignature, available - 1);
            return;
        }

        const sourceSignature = sourceSignatures[rowIndex];
        excludedCounts.set(sourceSignature, (excludedCounts.get(sourceSignature) || 0) + 1);
    });

    return {
        strategy: "source-row-signature",
        sourceColumns: (selectedAnalysisTable?.headers || []).map((header, order) => ({
            id: header.id ?? null,
            name: header.name || "",
            order
        })),
        excludedRows: [...excludedCounts].map(([signature, count]) => ({ signature, count }))
    };
};

const getPreviewState = (table, selectedAnalysisTable, selectedWorksheet, columnConfiguration) => {
    const columns = createFinalColumnSnapshot(table, selectedAnalysisTable, columnConfiguration);

    return {
        version: PREVIEW_STATE_VERSION,
        activeTable: {
            id: selectedAnalysisTable?.id ?? null,
            worksheetName: selectedWorksheet || selectedAnalysisTable?.worksheetName || "",
            title: table?.title || selectedAnalysisTable?.title || "",
            columns,
            sourceColumns: columnConfiguration.sourceColumns || [],
            rowSelection: getRowExclusions(table, selectedAnalysisTable, columns)
        }
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

    const columnConfiguration = getColumnConfiguration(table, selectedAnalysisTable, columnMappings);

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
        columnConfiguration,
        previewState: getPreviewState(table, selectedAnalysisTable, selectedWorksheet, columnConfiguration),
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

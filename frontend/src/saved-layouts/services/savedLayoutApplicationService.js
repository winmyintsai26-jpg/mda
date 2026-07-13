import { createSourceRowSignature, createSourceRowSignatures } from "../models/rowIdentity.js";

const normalize = (value) => String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const findTableForRegion = (analysisTables, savedRegion) => analysisTables.find((table) =>
    table.id === savedRegion.tableId
) || analysisTables.find((table) =>
    table.worksheetName === savedRegion.worksheetName && table.title === savedRegion.title
);

const findActiveTable = (analysisTables, layout) => analysisTables.find((table) =>
    table.id === layout.activeTable?.id
) || analysisTables.find((table) =>
    table.worksheetName === layout.activeWorksheet && table.title === layout.activeTable?.title
) || analysisTables.find((table) => table.worksheetName === layout.activeWorksheet)
    || analysisTables[0]
    || null;

const getSavedColumns = (layout) => {
    const snapshotColumns = layout.previewState?.activeTable?.columns;
    if (Array.isArray(snapshotColumns) && snapshotColumns.length > 0) {
        return [...snapshotColumns].sort((left, right) => left.order - right.order);
    }

    const configuration = layout.columnConfiguration || {};
    const addedById = new Map((configuration.addedColumns || []).map((column) => [column.id, column]));
    return [...(configuration.columns || [])]
        .sort((left, right) => left.order - right.order)
        .map((column) => ({
            ...column,
            sourceId: column.changeType === "added" ? null : column.id,
            sourceName: column.sourceName,
            kind: column.changeType === "added" ? "added" : "source",
            defaultValue: addedById.get(column.id)?.defaultValue ?? "",
            width: null
        }));
};

const filterPreviouslyDeletedRows = (currentTable, layout) => {
    const rowSelection = layout.previewState?.activeTable?.rowSelection;
    if (rowSelection?.strategy !== "source-row-signature" || !Array.isArray(rowSelection.excludedRows)) {
        const rows = Array.isArray(currentTable.rows) ? currentTable.rows : [];
        return { rows, sourceRowSignatures: createSourceRowSignatures(rows) };
    }

    const currentHeaders = Array.isArray(currentTable.headers) ? currentTable.headers : [];
    const sourceIndexes = (rowSelection.sourceColumns || []).map((sourceColumn) => {
        const idMatch = currentHeaders.findIndex((header) => sourceColumn.id && header.id === sourceColumn.id);
        if (idMatch >= 0) return idMatch;
        return currentHeaders.findIndex((header) => normalize(header.name) === normalize(sourceColumn.name));
    });
    const remainingExclusions = new Map(rowSelection.excludedRows.map(({ signature, count }) => [signature, count]));

    const rows = [];
    const sourceRowSignatures = [];
    (currentTable.rows || []).forEach((row) => {
        const sourceValues = sourceIndexes.map((index) => index >= 0 ? row?.[index] ?? "" : "");
        const signature = createSourceRowSignature(sourceValues);
        const remaining = remainingExclusions.get(signature) || 0;

        if (remaining > 0) {
            remainingExclusions.set(signature, remaining - 1);
            return;
        }

        rows.push(row);
        // Keep full current-row provenance for any layout saved from this preview.
        // The narrower signature above is used only to match the prior layout safely.
        sourceRowSignatures.push(createSourceRowSignature(row));
    });

    return { rows, sourceRowSignatures };
};

const applyPreviewState = (currentTable, layout) => {
    const currentHeaders = Array.isArray(currentTable.headers) ? currentTable.headers : [];
    const { rows: currentRows, sourceRowSignatures } = filterPreviouslyDeletedRows(currentTable, layout);
    const configuration = layout.columnConfiguration || {};
    const savedColumns = getSavedColumns(layout);
    const deletedIds = new Set((configuration.deletedColumns || []).map((column) => column.id).filter(Boolean));
    const deletedNames = new Set((configuration.deletedColumns || []).map((column) => normalize(column.name)).filter(Boolean));
    const usedCurrentIndexes = new Set();
    const nextHeaders = [];
    const valueResolvers = [];
    const columnWidths = {};

    savedColumns.forEach((savedColumn, savedIndex) => {
        const isAddedColumn = savedColumn.kind === "added" || savedColumn.changeType === "added";
        let currentIndex = -1;

        if (!isAddedColumn) {
            currentIndex = currentHeaders.findIndex((header, index) =>
                !usedCurrentIndexes.has(index) && savedColumn.sourceId && header.id === savedColumn.sourceId
            );

            if (currentIndex < 0) {
                const sourceKey = normalize(savedColumn.sourceName || savedColumn.name);
                currentIndex = currentHeaders.findIndex((header, index) =>
                    !usedCurrentIndexes.has(index) && normalize(header.name) === sourceKey
                );
            }
        }

        const headerId = savedColumn.id || `saved-layout-${layout.id}-col-${savedIndex}`;
        if (currentIndex >= 0) {
            usedCurrentIndexes.add(currentIndex);
            nextHeaders.push({
                ...currentHeaders[currentIndex],
                id: headerId,
                name: savedColumn.name,
                dataType: savedColumn.dataType || currentHeaders[currentIndex].dataType || "Text"
            });
            valueResolvers.push((row) => row?.[currentIndex] ?? "");
        } else {
            nextHeaders.push({
                id: headerId,
                name: savedColumn.name,
                dataType: savedColumn.dataType || "Text"
            });
            valueResolvers.push(() => isAddedColumn ? savedColumn.defaultValue ?? "" : "");
        }

        if (Number.isFinite(savedColumn.width)) {
            columnWidths[headerId] = savedColumn.width;
        }
    });

    currentHeaders.forEach((header, index) => {
        if (usedCurrentIndexes.has(index)) return;
        if (deletedIds.has(header.id) || deletedNames.has(normalize(header.name))) return;

        nextHeaders.push(header);
        valueResolvers.push((row) => row?.[index] ?? "");
    });

    return {
        ...currentTable,
        title: layout.previewState?.activeTable?.title || layout.activeTable?.title || currentTable.title,
        headers: nextHeaders,
        rows: currentRows.map((row) => valueResolvers.map((resolveValue) => resolveValue(row))),
        sourceRowSignatures,
        previewState: { columnWidths },
        validation: {
            ...currentTable.validation,
            savedConfiguration: layout.validationConfiguration || null
        },
        savedLayout: {
            id: layout.id,
            name: layout.name,
            schemaVersion: layout.schemaVersion,
            columnMappings: configuration.columnMappings || [],
            validationConfiguration: layout.validationConfiguration || null,
            importDestination: layout.importDestination || null
        }
    };
};

export class SavedLayoutApplicationService {
    apply(layout, analysisTables) {
        if (!layout || !Array.isArray(analysisTables)) {
            throw new Error("A saved layout and analyzed tables are required.");
        }

        const activeTable = findActiveTable(analysisTables, layout);
        const savedRegionByTableId = new Map();
        (layout.tableRegions || []).forEach((savedRegion) => {
            const matchingTable = findTableForRegion(analysisTables, savedRegion);
            if (matchingTable) savedRegionByTableId.set(matchingTable.id, savedRegion);
        });

        // Analysis results remain source-of-truth workbook data. The restored preview
        // is derived independently so future workbook rows and columns stay available.
        const nextAnalysisTables = analysisTables.map((table) => {
            const savedRegion = savedRegionByTableId.get(table.id);
            return savedRegion ? {
                ...table,
                savedStructure: {
                    region: savedRegion.region,
                    headerRow: savedRegion.headerRow
                }
            } : table;
        });

        const sourceActiveTable = nextAnalysisTables.find((table) => table.id === activeTable?.id)
            || nextAnalysisTables[0]
            || null;
        const appliedActiveTable = sourceActiveTable ? applyPreviewState(sourceActiveTable, layout) : null;
        const activeWorksheet = appliedActiveTable?.worksheetName || layout.activeWorksheet || "";
        const worksheetTables = nextAnalysisTables.filter((table) => table.worksheetName === activeWorksheet);
        const selectedTableIndex = Math.max(0, worksheetTables.findIndex((table) => table.id === sourceActiveTable?.id));

        return {
            analysisTables: nextAnalysisTables,
            activeTable: appliedActiveTable || { title: "", headers: [], rows: [] },
            selectedWorksheet: activeWorksheet,
            selectedTableIndex
        };
    }
}

export const savedLayoutApplicationService = new SavedLayoutApplicationService();

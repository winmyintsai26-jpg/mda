import { createSourceRowSignature, createSourceRowSignatures } from "../models/rowIdentity.js";

const normalize = (value) => String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const createColumnDescriptors = (headers) => {
    const occurrenceByName = new Map();

    return headers.map((header, index) => {
        const normalizedName = normalize(header.name);
        const occurrence = occurrenceByName.get(normalizedName) || 0;
        occurrenceByName.set(normalizedName, occurrence + 1);

        return { header, index, normalizedName, occurrence };
    });
};

const withColumnIdentities = (columns) => {
    const occurrenceByName = new Map();

    return columns.map((column) => {
        const normalizedName = column.normalizedName ?? normalize(column.name);
        const occurrence = Number.isInteger(column.occurrence)
            ? column.occurrence
            : (occurrenceByName.get(normalizedName) || 0);
        occurrenceByName.set(normalizedName, Math.max(occurrenceByName.get(normalizedName) || 0, occurrence + 1));
        return { ...column, normalizedName, occurrence };
    });
};

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

const getSourceColumnStates = (layout) => {
    const snapshotColumns = layout.previewState?.activeTable?.sourceColumns;
    if (Array.isArray(snapshotColumns) && snapshotColumns.length > 0) {
        return withColumnIdentities([...snapshotColumns].sort((left, right) => left.order - right.order));
    }

    const configuration = layout.columnConfiguration || {};
    if (Array.isArray(configuration.sourceColumns) && configuration.sourceColumns.length > 0) {
        return withColumnIdentities([...configuration.sourceColumns].sort((left, right) => left.order - right.order));
    }

    // Backward compatibility for layouts saved before source visibility was explicit.
    const visibleColumns = (configuration.columns || [])
        .filter((column) => column.changeType !== "added")
        .map((column) => ({
            id: column.id,
            name: column.sourceName || column.name,
            order: column.sourceOrder ?? column.order,
            visibility: "visible"
        }));
    const deletedColumns = (configuration.deletedColumns || []).map((column) => ({
        ...column,
        visibility: "deleted"
    }));

    return withColumnIdentities([...visibleColumns, ...deletedColumns]
        .sort((left, right) => left.order - right.order));
};

const matchSourceStatesToCurrentColumns = (sourceStates, currentDescriptors) => {
    const matches = new Map();
    const usedCurrentIndexes = new Set();

    sourceStates.forEach((sourceState) => {
        let descriptor = currentDescriptors.find((candidate) =>
            !usedCurrentIndexes.has(candidate.index)
            && candidate.normalizedName === sourceState.normalizedName
            && candidate.occurrence === sourceState.occurrence
        );

        if (!descriptor && sourceState.id != null) {
            descriptor = currentDescriptors.find((candidate) =>
                !usedCurrentIndexes.has(candidate.index)
                && candidate.header.id === sourceState.id
                && (!sourceState.normalizedName || candidate.normalizedName === sourceState.normalizedName)
            );
        }

        if (descriptor) {
            usedCurrentIndexes.add(descriptor.index);
            matches.set(descriptor.index, sourceState);
        }
    });

    return matches;
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
    const currentDescriptors = createColumnDescriptors(currentHeaders);
    const { rows: currentRows, sourceRowSignatures } = filterPreviouslyDeletedRows(currentTable, layout);
    const configuration = layout.columnConfiguration || {};
    const savedColumns = getSavedColumns(layout);
    const sourceStates = getSourceColumnStates(layout);
    const sourceStateByCurrentIndex = matchSourceStatesToCurrentColumns(sourceStates, currentDescriptors);
    const usedCurrentIndexes = new Set();
    const nextHeaders = [];
    const valueResolvers = [];
    const columnWidths = {};

    savedColumns.forEach((savedColumn, savedIndex) => {
        const isAddedColumn = savedColumn.kind === "added" || savedColumn.changeType === "added";
        let currentIndex = -1;

        if (!isAddedColumn) {
            const sourceName = normalize(savedColumn.sourceName || savedColumn.name);
            currentIndex = currentDescriptors.find((descriptor) =>
                !usedCurrentIndexes.has(descriptor.index)
                && descriptor.normalizedName === sourceName
                && (!Number.isInteger(savedColumn.sourceOccurrence)
                    || descriptor.occurrence === savedColumn.sourceOccurrence)
            )?.index ?? -1;

            if (currentIndex < 0) {
                currentIndex = currentDescriptors.find((descriptor) =>
                    !usedCurrentIndexes.has(descriptor.index)
                    && savedColumn.sourceId
                    && descriptor.header.id === savedColumn.sourceId
                    && (!sourceName || descriptor.normalizedName === sourceName)
                )?.index ?? -1;
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
        if (sourceStateByCurrentIndex.get(index)?.visibility === "deleted") return;

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

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

const applyColumnConfiguration = (currentTable, layout) => {
    const currentHeaders = Array.isArray(currentTable.headers) ? currentTable.headers : [];
    const currentRows = Array.isArray(currentTable.rows) ? currentTable.rows : [];
    const configuration = layout.columnConfiguration || {};
    const savedColumns = [...(configuration.columns || [])].sort((left, right) => left.order - right.order);
    const addedById = new Map((configuration.addedColumns || []).map((column) => [column.id, column]));
    const deletedIds = new Set((configuration.deletedColumns || []).map((column) => column.id).filter(Boolean));
    const deletedNames = new Set((configuration.deletedColumns || []).map((column) => normalize(column.name)).filter(Boolean));
    const usedCurrentIndexes = new Set();
    const nextHeaders = [];
    const valueResolvers = [];

    savedColumns.forEach((savedColumn, savedIndex) => {
        const isAddedColumn = savedColumn.changeType === "added" || addedById.has(savedColumn.id);
        let currentIndex = -1;

        if (!isAddedColumn) {
            currentIndex = currentHeaders.findIndex((header, index) =>
                !usedCurrentIndexes.has(index) && header.id === savedColumn.id
            );

            if (currentIndex < 0) {
                const sourceKey = normalize(savedColumn.sourceName || savedColumn.name);
                currentIndex = currentHeaders.findIndex((header, index) =>
                    !usedCurrentIndexes.has(index) && normalize(header.name) === sourceKey
                );
            }
        }

        if (currentIndex >= 0) {
            usedCurrentIndexes.add(currentIndex);
            nextHeaders.push({
                ...currentHeaders[currentIndex],
                name: savedColumn.name,
                dataType: savedColumn.dataType || currentHeaders[currentIndex].dataType || "Text"
            });
            valueResolvers.push((row) => row?.[currentIndex] ?? "");
            return;
        }

        const savedAddedColumn = addedById.get(savedColumn.id);
        nextHeaders.push({
            id: savedColumn.id || `saved-layout-${layout.id}-col-${savedIndex}`,
            name: savedColumn.name,
            dataType: savedColumn.dataType || "Text"
        });
        valueResolvers.push(() => savedAddedColumn?.defaultValue ?? "");
    });

    currentHeaders.forEach((header, index) => {
        if (usedCurrentIndexes.has(index)) {
            return;
        }

        if (deletedIds.has(header.id) || deletedNames.has(normalize(header.name))) {
            return;
        }

        nextHeaders.push(header);
        valueResolvers.push((row) => row?.[index] ?? "");
    });

    return {
        ...currentTable,
        title: layout.activeTable?.title || currentTable.title,
        headers: nextHeaders,
        rows: currentRows.map((row) => valueResolvers.map((resolveValue) => resolveValue(row))),
        savedLayout: {
            id: layout.id,
            name: layout.name,
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
            if (matchingTable) {
                savedRegionByTableId.set(matchingTable.id, savedRegion);
            }
        });

        const nextAnalysisTables = analysisTables.map((table) => {
            const savedRegion = savedRegionByTableId.get(table.id);
            const withSavedStructure = savedRegion ? {
                ...table,
                savedStructure: {
                    region: savedRegion.region,
                    headerRow: savedRegion.headerRow
                }
            } : table;

            if (!activeTable || table.id !== activeTable.id) {
                return withSavedStructure;
            }

            const configuredTable = applyColumnConfiguration(withSavedStructure, layout);
            return {
                ...configuredTable,
                validation: {
                    ...configuredTable.validation,
                    savedConfiguration: layout.validationConfiguration || null
                }
            };
        });

        const appliedActiveTable = nextAnalysisTables.find((table) => table.id === activeTable?.id)
            || nextAnalysisTables[0]
            || null;
        const activeWorksheet = appliedActiveTable?.worksheetName || layout.activeWorksheet || "";
        const worksheetTables = nextAnalysisTables.filter((table) => table.worksheetName === activeWorksheet);
        const selectedTableIndex = Math.max(0, worksheetTables.findIndex((table) => table.id === appliedActiveTable?.id));

        return {
            analysisTables: nextAnalysisTables,
            activeTable: appliedActiveTable ? {
                title: appliedActiveTable.title,
                headers: appliedActiveTable.headers,
                rows: appliedActiveTable.rows,
                savedLayout: appliedActiveTable.savedLayout
            } : { title: "", headers: [], rows: [] },
            selectedWorksheet: activeWorksheet,
            selectedTableIndex
        };
    }
}

export const savedLayoutApplicationService = new SavedLayoutApplicationService();

import assert from "node:assert/strict";
import test from "node:test";

import { createSavedLayout } from "../src/saved-layouts/models/savedLayout.js";
import { savedLayoutApplicationService } from "../src/saved-layouts/services/savedLayoutApplicationService.js";
import { LayoutMatchingService } from "../src/saved-layouts/services/layoutMatchingService.js";

const createHeader = (index, name) => ({
    id: `0-0-col-${index}`,
    name,
    dataType: "Text"
});

const createSourceTable = (headers, rows = [["a", "b", "c"]]) => ({
    id: "0-0",
    worksheetName: "Sheet1",
    title: "Source Table",
    headers,
    rows,
    source: {},
    validation: {}
});

const saveLayoutWithDeletedMiddleColumn = () => {
    const originalHeaders = [
        createHeader(0, "A"),
        createHeader(1, "B"),
        createHeader(2, "C")
    ];
    const sourceTable = createSourceTable(originalHeaders);
    const editedTable = {
        title: "Edited Table",
        headers: [originalHeaders[0], { ...originalHeaders[2], name: "Renamed C" }],
        rows: [["a", "c"]]
    };

    return createSavedLayout({
        name: "Deleted column layout",
        fileName: "source.xlsx",
        analysisTables: [sourceTable],
        table: editedTable,
        selectedAnalysisTable: sourceTable,
        selectedWorksheet: "Sheet1",
        columnMappings: [],
        destination: { provider: "mysql", database: "mda", table: "target" }
    });
};

test("saved layouts persist visibility for every analyzed source column", () => {
    const layout = saveLayoutWithDeletedMiddleColumn();

    assert.equal(layout.schemaVersion, 3);
    assert.deepEqual(
        layout.previewState.activeTable.sourceColumns.map(({ name, visibility }) => ({ name, visibility })),
        [
            { name: "A", visibility: "visible" },
            { name: "B", visibility: "deleted" },
            { name: "C", visibility: "visible" }
        ]
    );
});

test("restoration hides deleted columns and keeps newly detected columns visible", () => {
    const layout = saveLayoutWithDeletedMiddleColumn();
    const currentTable = createSourceTable([
        createHeader(0, "A"),
        createHeader(1, "New Column"),
        createHeader(2, "B"),
        createHeader(3, "C")
    ], [["new-a", "review-me", "deleted-b", "new-c"]]);

    const result = savedLayoutApplicationService.apply(layout, [currentTable]);

    assert.deepEqual(result.activeTable.headers.map((header) => header.name), ["A", "Renamed C", "New Column"]);
    assert.deepEqual(result.activeTable.rows, [["new-a", "new-c", "review-me"]]);
});

test("matching prefers the newest schema when layouts have equal accuracy", () => {
    const service = new LayoutMatchingService([], 0);
    const oldLayout = { schemaVersion: 2, createdAt: "2026-07-13T10:00:00Z" };
    const fixedLayout = { schemaVersion: 3, createdAt: "2026-07-13T11:00:00Z" };

    const match = service.findBestMatch([oldLayout, fixedLayout], []);

    assert.equal(match.layout, fixedLayout);
});

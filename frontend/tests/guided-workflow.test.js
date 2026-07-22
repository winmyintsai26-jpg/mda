import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createImportExecutor } from "../src/services/createImportExecutor.js";

test("the guided workflow exposes the five focused routes", async () => {
    const [appSource, progressSource, previewSource] = await Promise.all([
        readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
        readFile(new URL("../src/application/components/WorkflowProgress.jsx", import.meta.url), "utf8"),
        readFile(new URL("../src/pages/Preview.jsx", import.meta.url), "utf8")
    ]);

    assert.match(appSource, /path="\/import-plan"/);
    assert.match(appSource, /path="\/import"/);
    assert.match(progressSource, /"Upload Workbook", "Review & Edit", "Smart Import Plan", "Import", "Business Analysis"/);
    assert.match(previewSource, /Continue to Import Plan/);
    assert.match(previewSource, /navigate\("\/import-plan"\)/);
});

test("one approved plan cannot execute its import request twice", async () => {
    let requestCount = 0;
    const executeImportPlan = createImportExecutor(async () => {
        requestCount += 1;
        return { payload: { insertedRowCount: 2 }, elapsedMs: 10 };
    });

    const plan = {
        id: "strict-mode-plan",
        connection: { host: "localhost", port: 3306, username: "test", password: "test" },
        database: "operations",
        table: "orders",
        source: { headers: ["Product"], rows: [["A"], ["B"]] }
    };
    const [first, second] = await Promise.all([executeImportPlan(plan), executeImportPlan(plan)]);

    assert.equal(requestCount, 1);
    assert.equal(first.payload.insertedRowCount, 2);
    assert.deepEqual(second, first);
});

test("the import review uses an executive summary and six collapsed review cards", async () => {
    const [importPlanSource, importCompleteSource] = await Promise.all([
        readFile(new URL("../src/pages/Import.jsx", import.meta.url), "utf8"),
        readFile(new URL("../src/pages/ImportComplete.jsx", import.meta.url), "utf8")
    ]);

    for (const label of ["Structure", "Column Mapping", "Transformations", "Validation", "Duplicate Detection", "Destination"]) {
        assert.match(importPlanSource, new RegExp(`title="${label}"`));
    }

    assert.match(importPlanSource, /Rows ready to import/);
    assert.match(importPlanSource, /Rows requiring attention/);
    assert.match(importPlanSource, /Estimated import time/);
    assert.match(importPlanSource, /Overall status/);
    assert.equal((importPlanSource.match(/Execute Import/g) || []).length, 1);
    assert.match(importCompleteSource, /View Business Analysis/);
    assert.match(importCompleteSource, /Return to Workbooks/);
    assert.match(importCompleteSource, /Import duration/);
});

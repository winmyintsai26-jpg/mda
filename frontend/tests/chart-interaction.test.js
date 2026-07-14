import assert from "node:assert/strict";
import test from "node:test";

import { createChartInteraction } from "../src/business-analysis/services/createChartInteraction.js";

const dataset = {
    profiles: [{
        kind: "date",
        dateValues: [
            { rowIndex: 2, value: new Date(2026, 6, 14) },
            { rowIndex: 3, value: new Date(2026, 6, 15) }
        ]
    }]
};

test("category interactions expose the selected category, value, records, and available dates", () => {
    const interaction = createChartInteraction({
        type: "bar",
        title: "Weight by Product",
        meta: { categoryColumn: "Product", valueColumn: "Weight" }
    }, { label: "PP-Homopolymer (P5)", value: 1250, rowIndices: [2, 3] }, dataset);

    assert.equal(interaction.selectionLabel, "PP-Homopolymer (P5)");
    assert.deepEqual(interaction.rowIndices, [2, 3]);
    assert.deepEqual(interaction.fields, [
        { label: "Product", value: "PP-Homopolymer (P5)" },
        { label: "Weight", value: "1,250" },
        { label: "Date range", value: "Jul 14, 2026 – Jul 15, 2026" },
        { label: "Record count", value: "2" }
    ]);
});

test("time-series interactions use a readable date as drill-down context", () => {
    const interaction = createChartInteraction({
        type: "line",
        title: "Production Trend",
        meta: { dateColumn: "Production Date", valueColumn: null }
    }, { label: "2026-07-14", value: 43, rowIndices: [2, 3] }, dataset);

    assert.equal(interaction.selectionLabel, "Jul 14, 2026");
    assert.deepEqual(interaction.fields, [
        { label: "Production Date", value: "Jul 14, 2026" },
        { label: "Value", value: "43" },
        { label: "Record count", value: "2" }
    ]);
});

test("scatter interactions identify both values and remain traceable to one source row", () => {
    const interaction = createChartInteraction({
        type: "scatter",
        title: "Weight vs. Quantity",
        meta: { xColumn: "Weight", yColumn: "Quantity" }
    }, { x: 1250, y: 8, rowIndices: [2] }, dataset);

    assert.equal(interaction.selectionLabel, "Weight: 1,250 · Quantity: 8");
    assert.equal(interaction.fields.at(-1).value, "1");
});

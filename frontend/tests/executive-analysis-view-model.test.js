import assert from "node:assert/strict";
import test from "node:test";

import { createExecutiveAnalysisViewModel } from "../src/business-analysis/services/createExecutiveAnalysisViewModel.js";

const analysis = {
    executive: { recordCount: 10, columnCount: 4, completeness: 0.9, dateRange: null, categoryCount: 3, duplicateCount: 1, missingValueCount: 4 },
    insights: [
        { id: "insight-chart", title: "Chart finding", text: "Evidence", rowIndices: [1], chartId: "chart" },
        { id: "insight-quality-duplicates", title: "Duplicate warning", text: "Review", rowIndices: [2] },
        { id: "insight-quality-outlier", title: "Outlier", text: "Review", rowIndices: [3] }
    ],
    charts: [{ id: "chart", type: "bar", score: 0.95 }],
    qualityFindings: [
        { id: "duplicates", severity: "high" },
        { id: "outlier", severity: "medium" }
    ],
    numericProfiles: [],
    dataset: { rows: [], columns: [] },
    source: { name: "Imported table" }
};

test("executive presentation ranks urgent findings before chart evidence", () => {
    const viewModel = createExecutiveAnalysisViewModel(analysis);

    assert.deepEqual(viewModel.findings.map((finding) => finding.id), [
        "insight-quality-duplicates",
        "insight-chart",
        "insight-quality-outlier"
    ]);
    assert.equal(viewModel.findings[0].importanceLabel, "Critical");
});

test("executive presentation limits initial findings without changing engine results", () => {
    const viewModel = createExecutiveAnalysisViewModel(analysis, 2);

    assert.equal(viewModel.findings.length, 2);
    assert.equal(viewModel.additionalFindingCount, 1);
    assert.equal(analysis.insights.length, 3);
    assert.equal(viewModel.charts, analysis.charts);
});

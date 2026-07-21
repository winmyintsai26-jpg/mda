import assert from "node:assert/strict";
import test from "node:test";

import {
    AnalysisPipeline,
    BusinessAnalysisEngine,
    DEFAULT_ANALYSIS_STAGES,
    analyzeDataset,
    datasetUnderstandingStage,
    parseDate,
    parseNumber
} from "../src/business-analysis/analysisEngine.js";
import { InsightAnalyzer } from "../src/business-analysis/analyzers/InsightAnalyzer.js";
import { ChartGenerator } from "../src/business-analysis/charts/ChartGenerator.js";
import { ChartRanker } from "../src/business-analysis/charts/ChartRanker.js";

const source = {
    name: "Generic activity",
    headers: [
        { name: "Record ID", dataType: "Identifier" },
        { name: "Activity Date", dataType: "DateTime" },
        { name: "Group", dataType: "Text" },
        { name: "Amount", dataType: "Numeric" }
    ],
    rows: [
        ["A-1", "2026-07-01", "North", "1,000.00"],
        ["A-2", "2026-07-02", "North", "1,200.00"],
        ["A-3", "2026-07-03", "South", "(200.00)"],
        ["A-4", "2026-07-04", "South", "1,100.00"],
        ["A-5", "2026-07-05", "Special", "50,000.00"],
        ["A-4", "2026-07-04", "South", "1,100.00"],
        ["A-6", "", "North", ""]
    ]
};

test("parsers accept business-formatted numbers without treating identifiers as dates", () => {
    assert.equal(parseNumber("$1,250.50"), 1250.5);
    assert.equal(parseNumber("(207,140.00)"), -207140);
    assert.equal(parseNumber("15%"), 0.15);
    assert.equal(parseDate("12345"), null);
    assert.equal(parseDate("2026-07-14")?.getFullYear(), 2026);
});

test("dataset understanding is an independent pipeline stage", () => {
    const result = datasetUnderstandingStage({ source, options: { maxCharts: 5 } });

    assert.deepEqual(result.dataset.profiles.map((profile) => profile.kind), [
        "identifier",
        "date",
        "categorical",
        "numeric"
    ]);
    assert.equal(result.dataset.rows.length, 7);
});

test("analysis creates a generic executive summary and prioritized charts", () => {
    const analysis = analyzeDataset(source);

    assert.equal(analysis.executive.recordCount, 7);
    assert.equal(analysis.executive.columnCount, 4);
    assert.equal(analysis.executive.duplicateCount, 1);
    assert.equal(analysis.executive.missingValueCount, 2);
    assert.ok(analysis.executive.dateRange);
    assert.ok(analysis.charts.length > 0);
    assert.ok(analysis.charts.length <= 5);
    assert.ok(analysis.charts.every((chart) => chart.question && chart.score > 0));
    assert.ok(analysis.charts.some((chart) => chart.type === "line"));
    assert.ok(analysis.charts.some((chart) => ["horizontalBar", "donut"].includes(chart.type)));
});

test("quality and insight findings remain traceable to source rows", () => {
    const analysis = analyzeDataset(source);
    const duplicateFinding = analysis.qualityFindings.find((finding) => finding.id === "duplicates");
    const amountOutlier = analysis.qualityFindings.find((finding) => finding.id === "outlier-column-3");

    assert.deepEqual(duplicateFinding.rowIndices, [5]);
    assert.ok(amountOutlier.rowIndices.includes(4));
    assert.ok(analysis.insights.every((insight) => Array.isArray(insight.rowIndices)));
    assert.ok(analysis.charts.every((chart) => chart.data.every((point) => Array.isArray(point.rowIndices))));
});

test("the engine intentionally skips charts that answer no useful question", () => {
    const analysis = analyzeDataset({
        name: "Constant data",
        headers: [{ name: "Code" }, { name: "Note" }],
        rows: [["A", "Same"], ["B", "Same"], ["C", "Same"]]
    });

    assert.equal(analysis.charts.length, 0);
    assert.ok(analysis.qualityFindings.some((finding) => finding.id === "constant-column-1"));
});

test("the public result contract does not expose pipeline working state", () => {
    const analysis = new BusinessAnalysisEngine().analyze(source);

    assert.deepEqual(Object.keys(analysis), [
        "source",
        "options",
        "dataset",
        "executive",
        "numericProfiles",
        "kpis",
        "charts",
        "qualityFindings",
        "insights"
    ]);
    assert.deepEqual(analysis.charts.map((chart) => chart.id), [
        "category-column-2-column-3",
        "trend-column-1-column-3"
    ]);
    assert.deepEqual(analysis.qualityFindings.map((finding) => finding.id), [
        "duplicates",
        "outlier-column-3",
        "missing-column-1",
        "missing-column-3",
        "rare-column-2",
        "negative-column-3"
    ]);
});

test("the modular engine preserves complete Task 007 output parity", () => {
    const modularResult = analyzeDataset(source);
    const compatibilityResult = analyzeDataset(source, { stages: DEFAULT_ANALYSIS_STAGES });

    assert.deepEqual(modularResult, compatibilityResult);
});

test("new analyzers can be composed without modifying the pipeline", () => {
    const markerAnalyzer = {
        analyze: (context) => ({ ...context, marker: "registered" })
    };
    const basePipeline = new AnalysisPipeline();
    const extendedPipeline = basePipeline.register(markerAnalyzer);

    assert.deepEqual(basePipeline.run({}), {});
    assert.deepEqual(extendedPipeline.run({}), { marker: "registered" });
});

test("chart generation and chart ranking have separate responsibilities", () => {
    const generated = new ChartGenerator().analyze({
        trends: [{
            dateProfile: { id: "date", name: "Date", completeness: 1 },
            numericProfile: null,
            granularity: "day",
            measure: "records",
            data: [
                { label: "2026-07-01", value: 1, rowIndices: [0] },
                { label: "2026-07-02", value: 3, rowIndices: [1, 2, 3] }
            ]
        }],
        categories: [],
        relationships: []
    });

    assert.equal(generated.chartCandidates[0].score, undefined);
    assert.ok(generated.chartCandidates[0].ranking);

    const ranked = new ChartRanker().analyze({ ...generated, options: { maxCharts: 5 } });
    assert.ok(ranked.charts[0].score > 0);
    assert.equal(ranked.charts[0].ranking, undefined);
});

test("chart selection adapts to comparisons, category size, trends, and distributions", () => {
    const production = analyzeDataset({
        name: "Production performance",
        headers: ["Date", "Line", "Shift", "Product", "Planned", "Actual", "Reject"],
        rows: Array.from({ length: 12 }, (_, index) => [
            `2026-07-${String(index + 1).padStart(2, "0")}`,
            index % 2 ? "B" : "A",
            index % 3 ? "Day" : "Night",
            index % 2 ? "Resin B" : "Resin A",
            1200,
            1080 + index * 14,
            8 + index
        ])
    });

    assert.ok(production.charts.length <= 3);
    assert.equal(production.charts[0].type, "groupedBar");
    assert.match(production.charts[0].title, /Planned vs\. Actual/);
    assert.ok(production.charts.some((chart) => ["line", "area"].includes(chart.type)));
    assert.ok(production.charts.every((chart) => chart.score >= 0.55));
    assert.equal(new Set(production.charts.map((chart) => chart.question)).size, production.charts.length);
});

test("insight analysis consumes structured findings without reading raw rows", () => {
    const result = new InsightAnalyzer().analyze({
        charts: [],
        qualityFindings: [{ id: "warning", title: "Review this", detail: "Structured finding", rowIndices: [2] }]
    });

    assert.deepEqual(result.insights, [{
        id: "insight-quality-warning",
        title: "Review this",
        text: "Structured finding",
        rowIndices: [2]
    }]);
});

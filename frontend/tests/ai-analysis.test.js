import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { AiAnalysisOrchestrator } from "../src/ai-analysis/services/AiAnalysisOrchestrator.js";
import {
    APPROVED_ANALYSIS_OPERATIONS,
    runApprovedAnalysisTool,
    selectApprovedAnalysisOperation
} from "../src/ai-analysis/tools/approvedAnalysisTools.js";

const analysis = {
    source: { name: "Production", fileName: "production.xlsx", worksheet: "July" },
    executive: {
        recordCount: 6,
        completeness: 0.95,
        missingValueCount: 2,
        duplicateCount: 0
    },
    kpis: [
        { id: "records", label: "Total records", value: 6, format: "integer" },
        { id: "actual", label: "Total Actual", value: 21793, format: "number" }
    ],
    charts: [
        {
            id: "trend-actual",
            type: "line",
            title: "Actual over time",
            question: "How has actual production changed over time?",
            subtitle: "Daily view",
            data: [
                { label: "2026-07-01", value: 24878, rowIndices: [0, 1] },
                { label: "2026-07-02", value: 21793, rowIndices: [2, 3] }
            ],
            meta: { dateColumn: "Date", valueColumn: "Actual" },
            ranking: { relationshipStrength: 0.8 }
        },
        {
            id: "comparison-plan-actual",
            type: "groupedBar",
            title: "Planned vs. Actual",
            question: "How does planned compare with actual?",
            subtitle: "Compared across Line",
            data: [
                { label: "Line 1", values: [25000, 24000], rowIndices: [0, 1] },
                { label: "Line 2", values: [25400, 21793], rowIndices: [2, 3] }
            ],
            meta: { categoryColumn: "Line", seriesColumns: ["Planned", "Actual"] },
            ranking: { relationshipStrength: 1 }
        }
    ],
    qualityFindings: [
        { id: "outlier-reject", title: "1 unusual Reject value", detail: "The value is outside the typical range.", rowIndices: [4] }
    ],
    insights: [
        { id: "insight-trend", text: "Actual production decreased across the displayed period.", rowIndices: [0, 1, 2, 3] }
    ],
    dataset: {
        rows: [{ values: ["sensitive raw row"] }]
    }
};

test("AI analysis routes questions only to approved deterministic operations", () => {
    assert.deepEqual(APPROVED_ANALYSIS_OPERATIONS, [
        "overview",
        "trend",
        "comparison",
        "category",
        "quality",
        "anomaly",
        "relationship"
    ]);
    assert.equal(selectApprovedAnalysisOperation("Why did production decrease?"), "trend");
    assert.equal(selectApprovedAnalysisOperation("Compare planned versus actual"), "comparison");
    assert.equal(selectApprovedAnalysisOperation("Are there unusual values?"), "anomaly");
    assert.equal(selectApprovedAnalysisOperation("How complete is the data?"), "quality");
});

test("MDA calculates trend evidence before the provider receives it", () => {
    const evidence = runApprovedAnalysisTool(analysis, "Why did actual production decrease?");
    assert.equal(evidence.operation, "trend");
    assert.deepEqual(evidence.facts.map((fact) => fact.label), [
        "Start · 2026-07-01",
        "End · 2026-07-02",
        "Change",
        "Change %"
    ]);
    assert.equal(evidence.facts.find((fact) => fact.label === "Change").value, "-3,085");
    assert.equal(evidence.facts.find((fact) => fact.label === "Change %").value, "-12.4%");
    assert.deepEqual(evidence.source.rowIndices, [0, 1, 2, 3]);
});

test("the AI provider receives structured evidence but never raw workbook rows", async () => {
    let providerInput;
    const provider = {
        async explain(input) {
            providerInput = input;
            return { content: "Production decreased based on the verified trend.", provider: "test" };
        }
    };
    const orchestrator = new AiAnalysisOrchestrator(provider);
    const result = await orchestrator.ask({
        question: "Why did production decrease?",
        conversation: [{ role: "user", content: "Why did production decrease?" }],
        analysis
    });

    assert.equal(result.provider, "test");
    assert.equal(providerInput.evidence.operation, "trend");
    assert.doesNotMatch(JSON.stringify(providerInput.evidence), /sensitive raw row/);
    assert.equal("dataset" in providerInput.evidence, false);
});

test("follow-up questions retain the previous workbook investigation context", async () => {
    const provider = { async explain() { return { content: "Line 2 followed the same verified trend." }; } };
    const orchestrator = new AiAnalysisOrchestrator(provider);
    const result = await orchestrator.ask({
        question: "What about Line 2?",
        conversation: [
            { role: "user", content: "Why did production decrease?" },
            { role: "assistant", content: "Production decreased." },
            { role: "user", content: "What about Line 2?" }
        ],
        analysis
    });

    assert.equal(result.evidence.operation, "trend");
});

test("AI Analysis is an MDA-native route with a local provider boundary", async () => {
    const [appSource, pageSource, providerSource, backendSource] = await Promise.all([
        readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
        readFile(new URL("../src/application/pages/AiAnalysis.jsx", import.meta.url), "utf8"),
        readFile(new URL("../src/ai-analysis/providers/LocalAiAnalysisProvider.js", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/AIAnalysis/OllamaAiExplanationProvider.cs", import.meta.url), "utf8")
    ]);

    assert.match(appSource, /path="\/ai-analysis"/);
    assert.match(pageSource, /Ask MDA about your data/);
    assert.match(pageSource, /Ask anything about this workbook/);
    assert.match(pageSource, /Calculated by MDA/);
    assert.match(providerSource, /\/ai\/analysis\/explain/);
    assert.match(backendSource, /Never invent, estimate, recalculate, or alter a number/);
    assert.doesNotMatch(backendSource, /MySqlConnection|MySqlImport|SELECT\s|INSERT\s/);
});

import { formatCompactNumber } from "../../business-analysis/utils/NumberFormat.js";

export const APPROVED_ANALYSIS_OPERATIONS = Object.freeze([
    "overview",
    "trend",
    "comparison",
    "category",
    "quality",
    "anomaly",
    "relationship"
]);

const OPERATION_RULES = [
    { operation: "anomaly", pattern: /\b(anomal|unusual|outlier|rare|exception|unexpected)\w*/i },
    { operation: "quality", pattern: /\b(missing|duplicate|invalid|quality|complete|blank|null)\w*/i },
    { operation: "relationship", pattern: /\b(correlat|relationship|related|move together|cause)\w*/i },
    { operation: "trend", pattern: /\b(trend|over time|previous|day|week|month|increase|decrease|decline|change|drop|rise|fall)\w*/i },
    { operation: "comparison", pattern: /\b(compare|versus|vs\.?|difference|variance|gap|plan(?:ned)?|actual|reject|scrap|defect)\w*/i },
    { operation: "category", pattern: /\b(which|worst|best|largest|smallest|highest|lowest|line|shift|product|category|contributor)\w*/i }
];

function formatPercent(value) {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

function formatValue(value) {
    return typeof value === "number" ? formatCompactNumber(value) : String(value ?? "");
}

function unique(values) {
    return [...new Set(values.filter((value) => value != null))];
}

function chartSearchText(chart) {
    return [
        chart.title,
        chart.question,
        chart.subtitle,
        ...Object.values(chart.meta || {}).flat()
    ].join(" ").toLowerCase();
}

function relevantChart(charts, question, acceptedTypes) {
    const terms = question.toLowerCase().match(/[a-z0-9]+/g) || [];
    return charts
        .filter((chart) => acceptedTypes.includes(chart.type))
        .map((chart) => ({
            chart,
            score: terms.reduce((total, term) => total + (term.length > 2 && chartSearchText(chart).includes(term) ? 1 : 0), 0)
                + (chart.ranking?.relationshipStrength || 0)
        }))
        .sort((left, right) => right.score - left.score)[0]?.chart || null;
}

function baseEvidence(analysis, operation, title, summary, facts, rowIndices = []) {
    return {
        operation,
        title,
        summary,
        facts: facts.filter((fact) => fact?.value !== undefined && fact?.value !== null),
        source: {
            workbook: analysis.source?.fileName || analysis.source?.name || "Current workbook",
            worksheet: analysis.source?.worksheet || "",
            rowIndices: unique(rowIndices)
        }
    };
}

function overviewEvidence(analysis) {
    const facts = (analysis.kpis || []).slice(0, 5).map((kpi) => ({
        label: kpi.label,
        value: kpi.format === "percent" ? formatPercent(kpi.value) : formatValue(kpi.value)
    }));
    const leadingInsight = analysis.insights?.[0];
    return baseEvidence(
        analysis,
        "overview",
        "Workbook overview",
        leadingInsight?.text || "MDA summarized the strongest verified signals in the current workbook.",
        facts,
        leadingInsight?.rowIndices
    );
}

function trendEvidence(analysis, question) {
    const chart = relevantChart(analysis.charts || [], question, ["line", "area"]);
    if (!chart || chart.data.length < 2) return overviewEvidence(analysis);

    const first = chart.data[0];
    const last = chart.data.at(-1);
    const change = last.value - first.value;
    const percentChange = first.value ? change / Math.abs(first.value) : null;
    return baseEvidence(
        analysis,
        "trend",
        chart.title,
        `${chart.meta.valueColumn || "The measured value"} ${change < 0 ? "decreased" : change > 0 ? "increased" : "was unchanged"} across the displayed period.`,
        [
            { label: `Start · ${first.label}`, value: formatValue(first.value) },
            { label: `End · ${last.label}`, value: formatValue(last.value) },
            { label: "Change", value: formatValue(change) },
            ...(percentChange == null ? [] : [{ label: "Change %", value: formatPercent(percentChange) }])
        ],
        [...(first.rowIndices || []), ...(last.rowIndices || [])]
    );
}

function normalizedSeries(chart, item) {
    const labels = chart.meta.seriesColumns || [];
    if (item.values) {
        return item.values.map((value, index) => ({ label: labels[index] || `Series ${index + 1}`, value }));
    }
    return item.series || [];
}

function comparisonEvidence(analysis, question) {
    const chart = relevantChart(analysis.charts || [], question, ["groupedBar", "stackedBar"]);
    if (!chart || !chart.data.length) return categoryEvidence(analysis, question);

    const rows = chart.data.map((item) => {
        const series = normalizedSeries(chart, item);
        const gap = series.length >= 2 ? series[1].value - series[0].value : 0;
        return { item, series, gap };
    });
    const largestGap = [...rows].sort((left, right) => Math.abs(right.gap) - Math.abs(left.gap))[0];
    const facts = largestGap.series.map((series) => ({ label: `${largestGap.item.label} · ${series.label}`, value: formatValue(series.value) }));
    if (largestGap.series.length >= 2) facts.push({ label: `${largestGap.item.label} · Variance`, value: formatValue(largestGap.gap) });

    return baseEvidence(
        analysis,
        "comparison",
        chart.title,
        `${largestGap.item.label} has the largest verified difference in the displayed comparison.`,
        facts,
        largestGap.item.rowIndices || largestGap.item.series?.flatMap((series) => series.rowIndices || [])
    );
}

function categoryEvidence(analysis, question) {
    const chart = relevantChart(analysis.charts || [], question, ["horizontalBar", "bar", "donut", "pie"]);
    if (!chart || !chart.data.length) return overviewEvidence(analysis);

    const ranked = [...chart.data].sort((left, right) => right.value - left.value);
    const total = chart.meta.total || ranked.reduce((sum, item) => sum + item.value, 0);
    const leader = ranked[0];
    return baseEvidence(
        analysis,
        "category",
        chart.title,
        `${leader.label} is the leading ${String(chart.meta.categoryColumn || "category").toLowerCase()} in the verified comparison.`,
        ranked.slice(0, 4).map((item) => ({
            label: item.label,
            value: total ? `${formatValue(item.value)} · ${formatPercent(item.value / total)}` : formatValue(item.value)
        })),
        leader.rowIndices
    );
}

function qualityEvidence(analysis) {
    const findings = analysis.qualityFindings || [];
    return baseEvidence(
        analysis,
        "quality",
        "Data quality",
        findings[0]?.detail || "MDA did not detect a significant data-quality issue.",
        [
            { label: "Completeness", value: formatPercent(analysis.executive?.completeness ?? 0) },
            { label: "Missing values", value: formatValue(analysis.executive?.missingValueCount ?? 0) },
            { label: "Duplicate records", value: formatValue(analysis.executive?.duplicateCount ?? 0) },
            ...findings.slice(0, 3).map((finding) => ({ label: finding.title, value: `${finding.rowIndices.length} row${finding.rowIndices.length === 1 ? "" : "s"}` }))
        ],
        findings.flatMap((finding) => finding.rowIndices || [])
    );
}

function anomalyEvidence(analysis) {
    const findings = (analysis.qualityFindings || []).filter((finding) => /outlier|rare|unusual|exception/i.test(`${finding.id} ${finding.title} ${finding.detail}`));
    if (!findings.length) {
        return baseEvidence(analysis, "anomaly", "Unusual values", "MDA did not detect a strong anomaly in the current analysis.", [{ label: "Detected anomalies", value: "0" }]);
    }
    return baseEvidence(
        analysis,
        "anomaly",
        "Unusual values",
        findings[0].detail,
        findings.slice(0, 5).map((finding) => ({ label: finding.title, value: `${finding.rowIndices.length} row${finding.rowIndices.length === 1 ? "" : "s"}` })),
        findings.flatMap((finding) => finding.rowIndices || [])
    );
}

function relationshipEvidence(analysis, question) {
    const chart = relevantChart(analysis.charts || [], question, ["scatter"]);
    if (!chart) return overviewEvidence(analysis);
    return baseEvidence(
        analysis,
        "relationship",
        chart.title,
        "MDA measured the relationship using the verified numeric values in the workbook.",
        [
            { label: "Correlation", value: chart.meta.correlation.toFixed(2) },
            { label: "Direction", value: chart.meta.correlation >= 0 ? "Positive" : "Negative" },
            { label: "Evidence points", value: formatValue(chart.data.length) }
        ],
        chart.data.flatMap((item) => item.rowIndices || [])
    );
}

export function selectApprovedAnalysisOperation(question) {
    return OPERATION_RULES.find((rule) => rule.pattern.test(question))?.operation || "overview";
}

export function runApprovedAnalysisTool(analysis, question) {
    const operation = selectApprovedAnalysisOperation(question);
    if (operation === "trend") return trendEvidence(analysis, question);
    if (operation === "comparison") return comparisonEvidence(analysis, question);
    if (operation === "category") return categoryEvidence(analysis, question);
    if (operation === "quality") return qualityEvidence(analysis);
    if (operation === "anomaly") return anomalyEvidence(analysis);
    if (operation === "relationship") return relationshipEvidence(analysis, question);
    return overviewEvidence(analysis);
}

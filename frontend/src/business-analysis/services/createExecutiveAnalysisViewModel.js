const QUALITY_IMPORTANCE = {
    high: { score: 1, label: "Critical", tone: "critical" },
    medium: { score: 0.84, label: "High", tone: "high" },
    info: { score: 0.62, label: "Important", tone: "important" }
};

function rankInsight(insight, analysis, index) {
    const qualityId = insight.id.startsWith("insight-quality-")
        ? insight.id.replace("insight-quality-", "")
        : null;
    const qualityFinding = qualityId
        ? analysis.qualityFindings.find((finding) => finding.id === qualityId)
        : null;
    const chart = insight.chartId
        ? analysis.charts.find((candidate) => candidate.id === insight.chartId)
        : null;
    const importance = qualityFinding
        ? QUALITY_IMPORTANCE[qualityFinding.severity] || QUALITY_IMPORTANCE.info
        : {
            score: chart?.score ?? 0.5,
            label: (chart?.score ?? 0) >= 0.9 ? "High" : "Important",
            tone: (chart?.score ?? 0) >= 0.9 ? "high" : "important"
        };

    return {
        ...insight,
        importanceScore: importance.score,
        importanceLabel: importance.label,
        importanceTone: importance.tone,
        originalIndex: index
    };
}

function createExecutiveBrief(analysis) {
    const bullets = [];
    const add = (icon, text, sourceId) => {
        if (!text || bullets.some((item) => item.text === text) || bullets.length >= 6) return;
        bullets.push({ id: `brief-${sourceId}-${bullets.length}`, icon, text });
    };

    analysis.charts.forEach((chart) => {
        const data = chart.data || [];
        const meta = chart.meta || {};
        if (["horizontalBar", "bar", "donut", "pie"].includes(chart.type) && data.length) {
            const leader = data[0];
            const share = meta.total ? Math.abs(leader.value) / meta.total : null;
            add("✓", `${leader.label} is the leading ${String(meta.categoryColumn || "category").toLowerCase()} contributor${share == null ? "" : `, representing ${Math.round(share * 100)}% of the measured total`}.`, chart.id);
        } else if (["line", "area"].includes(chart.type) && data.length >= 2) {
            const first = data[0].value;
            const last = data.at(-1).value;
            const change = first ? (last - first) / Math.abs(first) : null;
            const measure = meta.valueColumn || "Activity";
            if (change == null || Math.abs(change) <= 0.05) add("✓", `${measure} remained broadly stable across the reporting period.`, chart.id);
            else add(change > 0 ? "↑" : "↓", `${measure} ended the reporting period ${change > 0 ? "above" : "below"} its starting level.`, chart.id);
        } else if (chart.type === "scatter") {
            add(Math.abs(meta.correlation) >= 0.7 ? "↑" : "✓", `${meta.xColumn} and ${meta.yColumn} show a ${Math.abs(meta.correlation) >= 0.7 ? "strong" : "moderate"} ${meta.correlation >= 0 ? "positive" : "negative"} relationship worth reviewing.`, chart.id);
        } else if (["groupedBar", "stackedBar"].includes(chart.type)) {
            add("✓", `${chart.title} reveals the clearest performance differences across the compared groups.`, chart.id);
        } else if (chart.type === "histogram" && data.length) {
            const peak = [...data].sort((left, right) => right.value - left.value)[0];
            add("✓", `${meta.distributionColumn} is most concentrated in the ${peak.label} range.`, chart.id);
        }
    });

    analysis.qualityFindings.slice(0, 2).forEach((finding) => add("⚠", `${finding.title || "A data-quality exception"} should be reviewed before decisions rely on the affected records.`, finding.id));
    if (!analysis.qualityFindings.length) add("✓", "No material data-quality exceptions were detected in the analyzed records.", "quality");
    else add("⚠", "The report contains data-quality exceptions that should be considered when interpreting the findings.", "quality-summary");
    if (!analysis.charts.some((chart) => ["line", "area"].includes(chart.type))) add("✓", "The available fields do not support a reliable time-based trend, so no trend conclusion is presented.", "trend");
    if (!analysis.charts.some((chart) => ["horizontalBar", "bar", "donut", "pie", "groupedBar", "stackedBar"].includes(chart.type))) add("✓", "No category comparison was strong enough to support an executive conclusion.", "category");
    if ((analysis.executive?.categoryCount || 0) > 1) add("✓", "The dataset contains enough category variation to support comparative analysis.", "category-coverage");
    add("✓", "The report shows only relationships that passed MDA’s usefulness and readability thresholds.", "selection");
    return bullets.slice(0, 6);
}

export function createExecutiveAnalysisViewModel(analysis, maximumFindings = 5) {
    if (!analysis) return null;

    const rankedFindings = analysis.insights
        .map((insight, index) => rankInsight(insight, analysis, index))
        .sort((left, right) => right.importanceScore - left.importanceScore || left.originalIndex - right.originalIndex);

    return {
        summary: {
            recordCount: analysis.executive.recordCount,
            columnCount: analysis.executive.columnCount,
            completeness: analysis.executive.completeness,
            dateRange: analysis.executive.dateRange,
            categoryCount: analysis.executive.categoryCount,
            duplicateCount: analysis.executive.duplicateCount,
            missingValueCount: analysis.executive.missingValueCount
        },
        findings: rankedFindings.slice(0, maximumFindings),
        executiveBrief: createExecutiveBrief(analysis),
        additionalFindingCount: Math.max(0, rankedFindings.length - maximumFindings),
        charts: analysis.charts,
        relationships: analysis.charts.filter((chart) => chart.type === "scatter"),
        statistics: analysis.numericProfiles,
        qualityFindings: analysis.qualityFindings,
        dataset: analysis.dataset,
        source: analysis.source
    };
}

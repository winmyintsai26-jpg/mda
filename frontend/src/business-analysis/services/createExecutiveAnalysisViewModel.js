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
        additionalFindingCount: Math.max(0, rankedFindings.length - maximumFindings),
        charts: analysis.charts,
        relationships: analysis.charts.filter((chart) => chart.type === "scatter"),
        statistics: analysis.numericProfiles,
        qualityFindings: analysis.qualityFindings,
        dataset: analysis.dataset,
        source: analysis.source
    };
}

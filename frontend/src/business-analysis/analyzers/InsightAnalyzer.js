import { createInsight } from "../models/Insight.js";
import { formatCompactNumber } from "../utils/NumberFormat.js";

export class InsightAnalyzer {
    analyze(context) {
        const insights = [];

        context.charts.forEach((chart) => {
            const insight = this.fromChart(chart);
            if (insight) insights.push(insight);
        });

        context.qualityFindings.slice(0, 3).forEach((finding) => {
            insights.push(createInsight({ id: `insight-quality-${finding.id}`, title: finding.title, text: finding.detail, rowIndices: finding.rowIndices }));
        });

        return { ...context, insights: insights.slice(0, 8) };
    }

    fromChart(chart) {
        if (["bar", "horizontalBar", "pie", "donut", "histogram"].includes(chart.type) && chart.data.length) {
            const first = chart.data[0];
            const share = chart.meta.total ? Math.abs(first.value) / chart.meta.total : 0;
            return createInsight({
                id: `insight-${chart.id}`,
                title: `${first.label} leads ${chart.meta.categoryColumn}`,
                text: `${first.label} represents ${Math.round(share * 100)}% of the displayed ${String(chart.meta.valueColumn || "records").toLowerCase()} across ${chart.meta.categoryColumn}.`,
                rowIndices: first.rowIndices,
                chartId: chart.id
            });
        }

        if (["line", "area"].includes(chart.type) && chart.data.length >= 2) {
            const first = chart.data[0];
            const last = chart.data[chart.data.length - 1];
            const difference = last.value - first.value;
            const direction = difference > 0 ? "increased" : difference < 0 ? "decreased" : "was unchanged";
            const percent = first.value ? Math.abs(difference / first.value) : null;
            return createInsight({
                id: `insight-${chart.id}`,
                title: `${chart.meta.valueColumn || "Record activity"} ${direction}`,
                text: `${chart.meta.valueColumn || "Record activity"} ${direction} from ${formatCompactNumber(first.value)} to ${formatCompactNumber(last.value)}${percent == null ? "" : ` (${Math.round(percent * 100)}%)`} across the displayed period.`,
                rowIndices: [...new Set([...(first.rowIndices || []), ...(last.rowIndices || [])])],
                chartId: chart.id
            });
        }

        if (chart.type === "scatter") {
            return createInsight({
                id: `insight-${chart.id}`,
                title: `${chart.meta.xColumn} and ${chart.meta.yColumn} move ${chart.meta.correlation >= 0 ? "together" : "in opposite directions"}`,
                text: `The observed correlation is ${chart.meta.correlation.toFixed(2)}. This relationship is worth investigating, but it does not establish cause and effect.`,
                rowIndices: chart.data.flatMap((item) => item.rowIndices),
                chartId: chart.id
            });
        }

        if (["groupedBar", "stackedBar"].includes(chart.type) && chart.data.length) {
            const labels = chart.meta.seriesColumns || [...new Set(chart.data.flatMap((item) => (item.series || []).map((series) => series.label)))];
            if (labels.length < 2) return null;
            const totals = labels.map((label, index) => chart.data.reduce((sum, item) => {
                if (item.values) return sum + (item.values[index] || 0);
                return sum + (item.series?.find((series) => series.label === label)?.value || 0);
            }, 0));
            const leaderIndex = totals[0] >= totals[1] ? 0 : 1;
            return createInsight({
                id: `insight-${chart.id}`,
                title: `${labels[leaderIndex]} leads the comparison`,
                text: `${labels[leaderIndex]} is higher overall than ${labels[leaderIndex === 0 ? 1 : 0]} across the displayed comparison.`,
                rowIndices: chart.data.flatMap((item) => item.rowIndices || item.series?.flatMap((series) => series.rowIndices) || []),
                chartId: chart.id
            });
        }

        return null;
    }
}

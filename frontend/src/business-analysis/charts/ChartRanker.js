import { seriesVariation } from "../utils/Statistics.js";
import { ChartSelector } from "./ChartSelector.js";

export class ChartRanker {
    constructor(selector = new ChartSelector()) {
        this.selector = selector;
    }

    analyze(context) {
        const ranked = context.chartCandidates.map((candidate) => this.rank(candidate));
        const charts = this.selector.select(ranked, context.options.maxCharts);
        return { ...context, charts };
    }

    rank(candidate) {
        const score = this.calculateScore(candidate);
        return {
            id: candidate.id,
            type: candidate.type,
            title: candidate.title,
            subtitle: candidate.subtitle,
            question: candidate.question,
            data: candidate.data,
            score,
            meta: candidate.meta
        };
    }

    calculateScore(candidate) {
        const ranking = candidate.ranking;
        const completeness = ranking.completeness ?? 0;
        const variation = candidate.data[0]?.series
            ? seriesVariation(candidate.data.flatMap((item) => item.series.map((series) => series.value)))
            : seriesVariation(candidate.data.map((item) => item.value).filter(Number.isFinite));
        const readability = this.readability(candidate);
        const usefulness = this.businessUsefulness(candidate);
        const suitability = this.visualSuitability(candidate);
        const relationship = Math.min(1, Math.abs(ranking.relationshipStrength ?? ranking.correlation ?? variation));
        const datasetFit = this.datasetFit(candidate);
        return Math.min(0.99, readability * 0.2 + usefulness * 0.24 + datasetFit * 0.14 + relationship * 0.14 + suitability * 0.16 + completeness * 0.12);
    }

    readability(candidate) {
        const count = candidate.data.length;
        if (["donut", "pie"].includes(candidate.type)) return count <= 6 ? 0.96 : 0.35;
        if (["groupedBar", "stackedBar"].includes(candidate.type)) return count <= 8 ? 0.86 : 0.62;
        if (candidate.type === "scatter") return count <= 250 ? 0.82 : 0.6;
        return count <= 12 ? 0.94 : count <= 30 ? 0.82 : 0.64;
    }

    businessUsefulness(candidate) {
        const values = { comparison: 1, trend: 0.94, category: 0.9, multiCategory: 0.84, relationship: 0.78, distribution: 0.72 };
        return values[candidate.ranking.kind] ?? 0.65;
    }

    visualSuitability(candidate) {
        const kind = candidate.ranking.kind;
        if (kind === "trend") return ["line", "area"].includes(candidate.type) ? 1 : 0.45;
        if (kind === "category") return ["donut", "horizontalBar", "bar"].includes(candidate.type) ? 1 : 0.5;
        if (kind === "relationship") return candidate.type === "scatter" ? 1 : 0.4;
        if (kind === "comparison") return candidate.type === "groupedBar" ? 1 : 0.55;
        if (kind === "multiCategory") return ["groupedBar", "stackedBar"].includes(candidate.type) ? 0.96 : 0.5;
        if (kind === "distribution") return candidate.type === "histogram" ? 1 : 0.5;
        return 0.6;
    }

    datasetFit(candidate) {
        const count = candidate.data.length;
        if (!count) return 0;
        if (["donut", "pie"].includes(candidate.type)) return count <= 6 ? 1 : 0.3;
        if (candidate.type === "scatter") return count >= 8 ? 0.9 : 0.68;
        if (candidate.type === "histogram") return count >= 5 ? 0.9 : 0.6;
        return count >= 2 && count <= 20 ? 0.92 : 0.68;
    }
}

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
        if (ranking.kind === "trend") {
            return 0.64 + ranking.completeness * 0.2 + seriesVariation(candidate.data.map((item) => item.value)) * 0.16;
        }
        if (ranking.kind === "category") {
            return 0.52 + ranking.completeness * 0.2 + Math.min(0.18, ranking.topShare) + (ranking.groupCount <= 10 ? 0.1 : 0);
        }
        return 0.45 + Math.abs(ranking.correlation) * 0.4 + ranking.completeness * 0.15;
    }
}

import { createChartDefinition } from "../models/ChartDefinition.js";

export class ChartGenerator {
    analyze(context) {
        const chartCandidates = [
            ...context.trends.map((trend) => this.fromTrend(trend)),
            ...context.categories.map((category) => this.fromCategory(category)),
            ...context.relationships.map((relationship) => this.fromRelationship(relationship))
        ];

        return { ...context, chartCandidates };
    }

    fromTrend(trend) {
        const { dateProfile, numericProfile, granularity, data, measure } = trend;
        return createChartDefinition({
            id: `trend-${dateProfile.id}-${numericProfile?.id || "records"}`,
            type: "line",
            title: `${measure} over time`,
            subtitle: `${granularity[0].toUpperCase()}${granularity.slice(1)}ly view using ${dateProfile.name}`,
            question: `How has ${measure.toLowerCase()} changed over time?`,
            data,
            meta: { dateColumn: dateProfile.name, valueColumn: numericProfile?.name || null, granularity },
            ranking: { kind: "trend", completeness: dateProfile.completeness }
        });
    }

    fromCategory(category) {
        const { categoryProfile, numericProfile, data, groupCount, total, topShare, measure } = category;
        return createChartDefinition({
            id: `category-${categoryProfile.id}-${numericProfile?.id || "records"}`,
            type: "bar",
            title: `${measure} by ${categoryProfile.name}`,
            subtitle: `Top ${data.length} of ${groupCount} categories`,
            question: `Which ${categoryProfile.name.toLowerCase()} categories contribute the most ${measure.toLowerCase()}?`,
            data,
            meta: { categoryColumn: categoryProfile.name, valueColumn: numericProfile?.name || null, total, topShare },
            ranking: { kind: "category", completeness: categoryProfile.completeness, groupCount, topShare }
        });
    }

    fromRelationship(relationship) {
        const { left, right, data, correlation } = relationship;
        return createChartDefinition({
            id: `relationship-${left.id}-${right.id}`,
            type: "scatter",
            title: `${left.name} vs. ${right.name}`,
            subtitle: `${correlation >= 0 ? "Positive" : "Negative"} relationship · r ${correlation.toFixed(2)}`,
            question: `Do ${left.name.toLowerCase()} and ${right.name.toLowerCase()} move together?`,
            data,
            meta: { xColumn: left.name, yColumn: right.name, correlation },
            ranking: { kind: "relationship", correlation, completeness: Math.min(left.completeness, right.completeness) }
        });
    }
}

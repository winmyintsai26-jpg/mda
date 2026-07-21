import { createChartDefinition } from "../models/ChartDefinition.js";

export class ChartGenerator {
    analyze(context) {
        const chartCandidates = [
            ...(context.trends || []).map((trend) => this.fromTrend(trend)),
            ...(context.categories || []).map((category) => this.fromCategory(category)),
            ...(context.relationships || []).map((relationship) => this.fromRelationship(relationship)),
            ...(context.comparisons || []).map((comparison) => this.fromComparison(comparison)),
            ...(context.crossCategories || []).map((crossCategory) => this.fromCrossCategory(crossCategory)),
            ...(context.distributions || []).map((distribution) => this.fromDistribution(distribution))
        ];

        return { ...context, chartCandidates };
    }

    fromTrend(trend) {
        const { dateProfile, numericProfile, granularity, data, measure } = trend;
        return createChartDefinition({
            id: `trend-${dateProfile.id}-${numericProfile?.id || "records"}`,
            type: data.length >= 8 ? "area" : "line",
            title: `${measure} over time`,
            subtitle: `${granularity[0].toUpperCase()}${granularity.slice(1)}ly view using ${dateProfile.name}`,
            question: `How has ${measure.toLowerCase()} changed over time?`,
            data,
            meta: { dateColumn: dateProfile.name, valueColumn: numericProfile?.name || null, granularity },
            ranking: { kind: "trend", completeness: dateProfile.completeness, pointCount: data.length, relationshipStrength: 0.8 }
        });
    }

    fromCategory(category) {
        const { categoryProfile, numericProfile, data, groupCount, total, topShare, measure } = category;
        return createChartDefinition({
            id: `category-${categoryProfile.id}-${numericProfile?.id || "records"}`,
            type: groupCount <= 6 && data.every((item) => item.value >= 0) && total > 0 ? "donut" : "horizontalBar",
            title: `${measure} by ${categoryProfile.name}`,
            subtitle: `Top ${data.length} of ${groupCount} categories`,
            question: `Which ${categoryProfile.name.toLowerCase()} categories contribute the most ${measure.toLowerCase()}?`,
            data,
            meta: { categoryColumn: categoryProfile.name, valueColumn: numericProfile?.name || null, total, topShare },
            ranking: { kind: "category", completeness: categoryProfile.completeness, groupCount, topShare, relationshipStrength: topShare }
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
            ranking: { kind: "relationship", correlation, completeness: Math.min(left.completeness, right.completeness), relationshipStrength: Math.abs(correlation) }
        });
    }

    fromComparison(comparison) {
        const { left, right, categoryProfile, data } = comparison;
        return createChartDefinition({
            id: `comparison-${left.id}-${right.id}-${categoryProfile?.id || "overall"}`,
            type: "groupedBar",
            title: `${left.name} vs. ${right.name}`,
            subtitle: categoryProfile ? `Compared across ${categoryProfile.name}` : "Overall performance comparison",
            question: `How does ${left.name.toLowerCase()} compare with ${right.name.toLowerCase()}?`,
            data,
            meta: { categoryColumn: categoryProfile?.name || "Scope", seriesColumns: [left.name, right.name], valueColumn: `${left.name} / ${right.name}` },
            ranking: { kind: "comparison", completeness: Math.min(left.completeness, right.completeness), groupCount: data.length, relationshipStrength: 1 }
        });
    }

    fromCrossCategory(crossCategory) {
        const { primary, secondary, numericProfile, data, measure } = crossCategory;
        const seriesCount = new Set(data.flatMap((item) => item.series.map((series) => series.label))).size;
        return createChartDefinition({
            id: `cross-category-${primary.id}-${secondary.id}-${numericProfile?.id || "records"}`,
            type: seriesCount <= 3 ? "groupedBar" : "stackedBar",
            title: `${measure} by ${primary.name} and ${secondary.name}`,
            subtitle: `${seriesCount} ${secondary.name.toLowerCase()} groups compared`,
            question: `How does ${measure.toLowerCase()} vary across ${primary.name.toLowerCase()} and ${secondary.name.toLowerCase()}?`,
            data,
            meta: { categoryColumn: primary.name, seriesColumn: secondary.name, valueColumn: numericProfile?.name || null },
            ranking: { kind: "multiCategory", completeness: Math.min(primary.completeness, secondary.completeness), groupCount: data.length, seriesCount, relationshipStrength: 0.72 }
        });
    }

    fromDistribution(distribution) {
        const { profile, data, variation } = distribution;
        return createChartDefinition({
            id: `distribution-${profile.id}`,
            type: "histogram",
            title: `${profile.name} distribution`,
            subtitle: `${data.length} value ranges across ${profile.numericValues.length} records`,
            question: `How is ${profile.name.toLowerCase()} distributed?`,
            data,
            meta: { categoryColumn: `${profile.name} range`, valueColumn: "Record count", distributionColumn: profile.name },
            ranking: { kind: "distribution", completeness: profile.completeness, groupCount: data.length, relationshipStrength: variation }
        });
    }
}

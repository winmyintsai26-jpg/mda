import { seriesVariation } from "../utils/Statistics.js";

export class DistributionAnalyzer {
    analyze(context) {
        const distributions = context.dataset.profiles
            .filter((profile) => profile.kind === "numeric" && profile.numericValues.length >= 8)
            .map((profile) => this.createDistribution(profile))
            .filter(Boolean)
            .slice(0, 4);
        return { ...context, distributions };
    }

    createDistribution(profile) {
        const values = profile.numericValues.map((item) => item.value);
        const minimum = Math.min(...values);
        const maximum = Math.max(...values);
        const span = maximum - minimum;
        if (!span || seriesVariation(values) < 0.04) return null;

        const binCount = Math.min(8, Math.max(5, Math.ceil(Math.sqrt(values.length))));
        const width = span / binCount;
        const data = Array.from({ length: binCount }, (_, index) => ({
            label: `${formatBoundary(minimum + index * width)}–${formatBoundary(index === binCount - 1 ? maximum : minimum + (index + 1) * width)}`,
            value: 0,
            rowIndices: []
        }));
        profile.numericValues.forEach((item) => {
            const index = Math.min(binCount - 1, Math.floor((item.value - minimum) / width));
            data[index].value += 1;
            data[index].rowIndices.push(item.rowIndex);
        });
        return { profile, data, variation: seriesVariation(values) };
    }
}

function formatBoundary(value) {
    return new Intl.NumberFormat("en-US", { notation: Math.abs(value) >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

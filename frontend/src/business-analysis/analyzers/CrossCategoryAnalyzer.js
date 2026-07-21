import { selectPrimaryNumericProfile } from "../utils/ColumnHelpers.js";
import { isEmptyValue } from "../utils/ValueParsers.js";

export class CrossCategoryAnalyzer {
    analyze(context) {
        const categories = context.dataset.profiles
            .filter((profile) => profile.kind === "categorical" && profile.uniqueCount > 1 && profile.uniqueCount <= 10)
            .sort((left, right) => left.uniqueCount - right.uniqueCount);
        const numericProfile = selectPrimaryNumericProfile(context.dataset.profiles);
        const crossCategories = categories.length >= 2
            ? [this.createCrossCategory(context.dataset, categories[0], categories[1], numericProfile)].filter(Boolean)
            : [];
        return { ...context, crossCategories };
    }

    createCrossCategory(dataset, primary, secondary, numericProfile) {
        const numericByRow = new Map(numericProfile?.numericValues.map((item) => [item.rowIndex, item.value]) || []);
        const groups = new Map();
        dataset.rows.forEach((row) => {
            const primaryValue = row.values[primary.index];
            const secondaryValue = row.values[secondary.index];
            if (isEmptyValue(primaryValue) || isEmptyValue(secondaryValue)) return;
            const primaryLabel = String(primaryValue).trim();
            const secondaryLabel = String(secondaryValue).trim();
            if (!groups.has(primaryLabel)) groups.set(primaryLabel, new Map());
            const series = groups.get(primaryLabel);
            if (!series.has(secondaryLabel)) series.set(secondaryLabel, { label: secondaryLabel, value: 0, rowIndices: [] });
            const point = series.get(secondaryLabel);
            point.value += numericProfile && numericByRow.has(row.rowIndex) ? numericByRow.get(row.rowIndex) : 1;
            point.rowIndices.push(row.rowIndex);
        });
        const data = [...groups.entries()].map(([label, series]) => ({ label, series: [...series.values()].sort((a, b) => b.value - a.value) }));
        return data.length >= 2 ? { primary, secondary, numericProfile, data, measure: numericProfile?.name || "records" } : null;
    }
}

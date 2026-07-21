import { isEmptyValue } from "../utils/ValueParsers.js";

const COMPARISON_PAIRS = [
    [/(^|\b)(planned|plan|budget|target|forecast)(\b|$)/i, /(^|\b)(actual|produced|output|result)(\b|$)/i],
    [/(^|\b)(produced|production|output)(\b|$)/i, /(^|\b)(reject|rejected|scrap|defect)(\b|$)/i]
];

function isComparison(left, right) {
    return COMPARISON_PAIRS.some(([first, second]) =>
        (first.test(left.name) && second.test(right.name)) || (first.test(right.name) && second.test(left.name)));
}

export class PerformanceAnalyzer {
    analyze(context) {
        const numericProfiles = context.dataset.profiles.filter((profile) => profile.kind === "numeric" && profile.numericValues.length >= 2);
        const categoryProfile = context.dataset.profiles
            .filter((profile) => profile.kind === "categorical" && profile.uniqueCount > 1 && profile.uniqueCount <= 12)
            .sort((left, right) => left.uniqueCount - right.uniqueCount)[0];
        const comparisons = [];

        for (let leftIndex = 0; leftIndex < numericProfiles.length; leftIndex++) {
            for (let rightIndex = leftIndex + 1; rightIndex < numericProfiles.length; rightIndex++) {
                if (!isComparison(numericProfiles[leftIndex], numericProfiles[rightIndex])) continue;
                const comparison = this.createComparison(context.dataset, categoryProfile, numericProfiles[leftIndex], numericProfiles[rightIndex]);
                if (comparison) comparisons.push(comparison);
            }
        }

        return { ...context, comparisons };
    }

    createComparison(dataset, categoryProfile, left, right) {
        const leftByRow = new Map(left.numericValues.map((item) => [item.rowIndex, item.value]));
        const rightByRow = new Map(right.numericValues.map((item) => [item.rowIndex, item.value]));
        const groups = new Map();

        dataset.rows.forEach((row) => {
            if (!leftByRow.has(row.rowIndex) || !rightByRow.has(row.rowIndex)) return;
            const rawLabel = categoryProfile ? row.values[categoryProfile.index] : "Overall";
            if (categoryProfile && isEmptyValue(rawLabel)) return;
            const label = String(rawLabel).trim();
            if (!groups.has(label)) groups.set(label, { label, values: [0, 0], rowIndices: [] });
            const group = groups.get(label);
            group.values[0] += leftByRow.get(row.rowIndex);
            group.values[1] += rightByRow.get(row.rowIndex);
            group.rowIndices.push(row.rowIndex);
        });

        const data = [...groups.values()]
            .sort((a, b) => Math.max(...b.values.map(Math.abs)) - Math.max(...a.values.map(Math.abs)))
            .slice(0, 8);
        if (!data.length) return null;
        return { left, right, categoryProfile, data };
    }
}

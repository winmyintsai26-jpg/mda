import { selectPrimaryNumericProfile } from "../utils/ColumnHelpers.js";
import { isEmptyValue } from "../utils/ValueParsers.js";

export class CategoryAnalyzer {
    analyze(context) {
        const { dataset } = context;
        const numericProfile = selectPrimaryNumericProfile(dataset.profiles);
        const numericByRow = new Map(numericProfile?.numericValues.map((item) => [item.rowIndex, item.value]) || []);
        const categories = dataset.profiles
            .filter((profile) => profile.kind === "categorical" && profile.uniqueCount > 1)
            .map((profile) => this.createCategoryAnalysis(dataset, profile, numericProfile, numericByRow))
            .filter(Boolean);

        return { ...context, categories };
    }

    createCategoryAnalysis(dataset, categoryProfile, numericProfile, numericByRow) {
        const groups = new Map();

        dataset.rows.forEach((row) => {
            const raw = row.values[categoryProfile.index];
            if (isEmptyValue(raw)) return;
            const label = String(raw).trim();
            if (!groups.has(label)) groups.set(label, { label, value: 0, rowIndices: [] });
            const group = groups.get(label);
            group.value += numericProfile && numericByRow.has(row.rowIndex) ? numericByRow.get(row.rowIndex) : 1;
            group.rowIndices.push(row.rowIndex);
        });

        const data = [...groups.values()].sort((left, right) => right.value - left.value).slice(0, 8);
        if (data.length < 2) return null;

        const total = [...groups.values()].reduce((sum, item) => sum + Math.abs(item.value), 0);
        const topShare = total ? Math.abs(data[0]?.value || 0) / total : 0;
        return {
            categoryProfile,
            numericProfile,
            data,
            groupCount: groups.size,
            total,
            topShare,
            measure: numericProfile?.name || "records"
        };
    }
}

import { selectPrimaryNumericProfile } from "../utils/ColumnHelpers.js";
import { chooseTimeGranularity, timeBucket } from "../utils/DateHelpers.js";

export class TrendAnalyzer {
    analyze(context) {
        const { dataset } = context;
        const numericProfile = selectPrimaryNumericProfile(dataset.profiles);
        const numericByRow = new Map(numericProfile?.numericValues.map((item) => [item.rowIndex, item.value]) || []);
        const trends = dataset.profiles
            .filter((profile) => profile.kind === "date" && profile.dateValues.length >= 2)
            .map((dateProfile) => this.createTrend(dateProfile, numericProfile, numericByRow))
            .filter(Boolean);

        return { ...context, trends };
    }

    createTrend(dateProfile, numericProfile, numericByRow) {
        const granularity = chooseTimeGranularity(dateProfile.dateValues.map((item) => item.value));
        const buckets = new Map();

        dateProfile.dateValues.forEach((item) => {
            const key = timeBucket(item.value, granularity);
            if (!buckets.has(key)) buckets.set(key, { label: key, value: 0, rowIndices: [] });
            const bucket = buckets.get(key);
            bucket.value += numericProfile && numericByRow.has(item.rowIndex) ? numericByRow.get(item.rowIndex) : 1;
            bucket.rowIndices.push(item.rowIndex);
        });

        const data = [...buckets.values()].sort((left, right) => left.label.localeCompare(right.label));
        if (data.length < 2) return null;

        return { dateProfile, numericProfile, granularity, data, measure: numericProfile?.name || "records" };
    }
}

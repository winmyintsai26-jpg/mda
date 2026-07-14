import { isEmptyValue } from "../utils/ValueParsers.js";

export class DataQualityAnalyzer {
    analyze(context) {
        const { dataset } = context;
        const qualityFindings = [];

        dataset.profiles.forEach((profile) => {
            const baseOrder = profile.index * 10;
            if (profile.nonEmptyCount === 0) {
                qualityFindings.push(this.finding(baseOrder, { id: `empty-${profile.id}`, severity: "high", title: `${profile.name} is empty`, detail: "This column contains no usable values and may not belong in downstream analysis.", rowIndices: [] }));
            } else if (profile.uniqueCount === 1 && dataset.rows.length > 1) {
                qualityFindings.push(this.finding(baseOrder, { id: `constant-${profile.id}`, severity: "info", title: `${profile.name} has one value`, detail: "A constant column adds context but cannot explain differences between records.", rowIndices: dataset.rows.map((row) => row.rowIndex) }));
            }

            if (profile.missingCount > 0) {
                qualityFindings.push(this.finding(baseOrder + 1, {
                    id: `missing-${profile.id}`,
                    severity: profile.missingCount / Math.max(dataset.rows.length, 1) >= 0.25 ? "high" : "medium",
                    title: `${profile.missingCount} missing in ${profile.name}`,
                    detail: `${Math.round((profile.missingCount / Math.max(dataset.rows.length, 1)) * 100)}% of records have no value in this column.`,
                    rowIndices: dataset.rows.filter((row) => isEmptyValue(row.values[profile.index])).map((row) => row.rowIndex)
                }));
            }

            if (profile.invalidDateCount > 0) {
                const validRows = new Set(profile.dateValues.map((item) => item.rowIndex));
                qualityFindings.push(this.finding(baseOrder + 2, {
                    id: `invalid-date-${profile.id}`,
                    severity: "high",
                    title: `${profile.invalidDateCount} invalid dates in ${profile.name}`,
                    detail: "These non-empty values could not be interpreted as dates.",
                    rowIndices: dataset.rows.filter((row) => !isEmptyValue(row.values[profile.index]) && !validRows.has(row.rowIndex)).map((row) => row.rowIndex)
                }));
            }

            if (profile.kind === "numeric") {
                const negatives = profile.numericValues.filter((item) => item.value < 0);
                if (negatives.length > 0) {
                    qualityFindings.push(this.finding(baseOrder + 4, { id: `negative-${profile.id}`, severity: "info", title: `${negatives.length} negative ${profile.name} values`, detail: "Negative values may represent returns, adjustments, credits, or data issues.", rowIndices: negatives.map((item) => item.rowIndex) }));
                }
            }
        });

        if (context.executive.duplicateCount > 0) {
            qualityFindings.push(this.finding(dataset.profiles.length * 10, {
                id: "duplicates",
                severity: "high",
                title: `${context.executive.duplicateCount} duplicate records`,
                detail: "These rows repeat an earlier record exactly and may inflate totals or counts.",
                rowIndices: dataset.duplicateGroups.flatMap((group) => group.slice(1))
            }));
        }

        return { ...context, qualityFindings };
    }

    finding(order, values) {
        return { ...values, _order: order };
    }
}

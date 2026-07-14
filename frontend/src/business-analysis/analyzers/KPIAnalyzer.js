import { createKPI } from "../models/KPI.js";
import { METRIC_NAME_PATTERN } from "../utils/ColumnHelpers.js";
import { formatCompactNumber } from "../utils/NumberFormat.js";
import { extent, median } from "../utils/Statistics.js";
import { isEmptyValue } from "../utils/ValueParsers.js";

export class KPIAnalyzer {
    analyze(context) {
        const { dataset, executive } = context;
        const numericProfiles = dataset.profiles
            .filter((profile) => profile.kind === "numeric" && profile.numericValues.length > 0)
            .map((profile) => this.createNumericProfile(profile))
            .sort((left, right) => right.score - left.score);

        const kpis = [
            createKPI({ id: "records", label: "Total records", value: executive.recordCount, format: "integer", rowIndices: dataset.rows.map((row) => row.rowIndex), question: "How much data was imported?" }),
            createKPI({ id: "completeness", label: "Data completeness", value: executive.completeness, format: "percent", rowIndices: dataset.rows.filter((row) => row.values.some(isEmptyValue)).map((row) => row.rowIndex), question: "How complete is the imported dataset?" }),
            ...numericProfiles.slice(0, 3).map((metric) => createKPI({
                id: `total-${metric.columnId}`,
                label: `Total ${metric.columnName}`,
                value: metric.total,
                secondary: `Avg ${formatCompactNumber(metric.average)} · Median ${formatCompactNumber(metric.median)} · Range ${formatCompactNumber(metric.minimum)}–${formatCompactNumber(metric.maximum)}`,
                format: "number",
                rowIndices: metric.rowIndices,
                question: `What is the overall ${metric.columnName.toLowerCase()}?`
            }))
        ].slice(0, 5);

        return { ...context, numericProfiles, kpis };
    }

    createNumericProfile(profile) {
        const values = profile.numericValues.map((item) => item.value);
        const total = values.reduce((sum, value) => sum + value, 0);
        const range = extent(values);
        const score = (METRIC_NAME_PATTERN.test(profile.name) ? 0.35 : 0)
            + profile.completeness * 0.4
            + Math.min(0.25, (new Set(values).size / Math.max(values.length, 1)) * 0.25);

        return {
            columnId: profile.id,
            columnName: profile.name,
            total,
            average: total / values.length,
            minimum: range.minimum,
            maximum: range.maximum,
            median: median(values),
            rowIndices: profile.numericValues.map((item) => item.rowIndex),
            score
        };
    }
}

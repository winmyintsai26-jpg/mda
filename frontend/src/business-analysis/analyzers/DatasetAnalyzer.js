import { createDatasetSummary } from "../models/DatasetSummary.js";
import { DATE_NAME_PATTERN, IDENTIFIER_NAME_PATTERN, METRIC_NAME_PATTERN, normalizeHeaders } from "../utils/ColumnHelpers.js";
import { extent } from "../utils/Statistics.js";
import { isEmptyValue, parseDate, parseNumber } from "../utils/ValueParsers.js";

export class DatasetAnalyzer {
    analyze(context) {
        return this.summarize(this.profile(context));
    }

    profile(context) {
        const columns = normalizeHeaders(context.source.headers);
        const rows = (context.source.rows || []).map((row, rowIndex) => ({
            rowIndex,
            values: columns.map((column) => row?.[column.index] ?? "")
        }));

        const profiles = columns.map((column) => this.analyzeColumn(column, rows));
        const rowKeys = new Map();

        rows.forEach((row) => {
            const key = JSON.stringify(row.values.map((value) => String(value ?? "").trim()));
            if (!rowKeys.has(key)) rowKeys.set(key, []);
            rowKeys.get(key).push(row.rowIndex);
        });

        return {
            ...context,
            dataset: {
                columns,
                rows,
                profiles,
                duplicateGroups: [...rowKeys.values()].filter((indices) => indices.length > 1),
                missingValueCount: profiles.reduce((sum, profile) => sum + profile.missingCount, 0)
            }
        };
    }

    summarize(context) {
        const { dataset } = context;
        const totalCells = dataset.rows.length * dataset.columns.length;
        const dateValues = dataset.profiles.flatMap((profile) => profile.kind === "date" ? profile.dateValues.map((item) => item.value) : []);
        const categoryProfiles = dataset.profiles.filter((profile) => profile.kind === "categorical");
        const dateExtent = dateValues.length ? extent(dateValues.map((date) => date.getTime())) : null;

        return {
            ...context,
            executive: createDatasetSummary({
                recordCount: dataset.rows.length,
                columnCount: dataset.columns.length,
                completeness: totalCells ? (totalCells - dataset.missingValueCount) / totalCells : 1,
                missingValueCount: dataset.missingValueCount,
                duplicateCount: dataset.duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0),
                categoryCount: categoryProfiles.reduce((sum, profile) => sum + profile.uniqueCount, 0),
                dateRange: dateValues.length ? {
                    start: new Date(dateExtent.minimum),
                    end: new Date(dateExtent.maximum)
                } : null
            })
        };
    }

    analyzeColumn(column, rows) {
        const nonEmpty = rows.filter((row) => !isEmptyValue(row.values[column.index]));
        const numericValues = nonEmpty
            .map((row) => ({ rowIndex: row.rowIndex, value: parseNumber(row.values[column.index]) }))
            .filter((item) => item.value != null);
        const dateValues = nonEmpty
            .map((row) => ({ rowIndex: row.rowIndex, value: parseDate(row.values[column.index]) }))
            .filter((item) => item.value != null);
        const uniqueValues = new Map();

        nonEmpty.forEach((row) => {
            const value = String(row.values[column.index]).trim();
            uniqueValues.set(value, (uniqueValues.get(value) || 0) + 1);
        });

        const nonEmptyCount = nonEmpty.length;
        const numericRatio = nonEmptyCount ? numericValues.length / nonEmptyCount : 0;
        const dateRatio = nonEmptyCount ? dateValues.length / nonEmptyCount : 0;
        const uniqueRatio = nonEmptyCount ? uniqueValues.size / nonEmptyCount : 0;
        const declaredNumeric = /numeric|number|decimal|integer|float|double|currency/.test(column.declaredType);
        const declaredDate = /date|time/.test(column.declaredType);
        const isDate = nonEmptyCount > 0 && ((declaredDate && dateRatio >= 0.5) || dateRatio >= 0.85 || (DATE_NAME_PATTERN.test(column.name) && dateRatio >= 0.6));
        const isNumeric = !isDate && nonEmptyCount > 0 && ((declaredNumeric && numericRatio >= 0.6) || numericRatio >= 0.9);
        const isIdentifier = !isDate && (IDENTIFIER_NAME_PATTERN.test(column.name) || (uniqueRatio > 0.96 && !METRIC_NAME_PATTERN.test(column.name)));
        const isCategorical = !isDate && !isNumeric && !isIdentifier && uniqueValues.size > 0 && uniqueValues.size <= Math.max(20, Math.ceil(Math.sqrt(Math.max(rows.length, 1)) * 2));

        return {
            ...column,
            kind: isDate ? "date" : isNumeric ? "numeric" : isCategorical ? "categorical" : isIdentifier ? "identifier" : "text",
            nonEmptyCount,
            missingCount: rows.length - nonEmptyCount,
            completeness: rows.length ? nonEmptyCount / rows.length : 0,
            uniqueCount: uniqueValues.size,
            uniqueRatio,
            uniqueValues,
            numericValues,
            dateValues,
            invalidDateCount: declaredDate ? Math.max(0, nonEmptyCount - dateValues.length) : 0
        };
    }
}

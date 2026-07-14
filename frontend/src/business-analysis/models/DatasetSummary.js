export function createDatasetSummary(values) {
    return {
        recordCount: values.recordCount,
        columnCount: values.columnCount,
        completeness: values.completeness,
        missingValueCount: values.missingValueCount,
        duplicateCount: values.duplicateCount,
        categoryCount: values.categoryCount,
        dateRange: values.dateRange
    };
}

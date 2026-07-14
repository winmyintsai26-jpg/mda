export function createInsight(values) {
    return {
        id: values.id,
        title: values.title,
        text: values.text,
        rowIndices: values.rowIndices,
        ...(values.chartId ? { chartId: values.chartId } : {})
    };
}

export function createKPI(values) {
    return {
        id: values.id,
        label: values.label,
        value: values.value,
        ...(values.secondary ? { secondary: values.secondary } : {}),
        format: values.format,
        rowIndices: values.rowIndices,
        question: values.question
    };
}

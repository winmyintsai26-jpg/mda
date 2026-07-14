export function createChartDefinition(values) {
    return {
        id: values.id,
        type: values.type,
        title: values.title,
        subtitle: values.subtitle,
        question: values.question,
        data: values.data,
        meta: values.meta,
        ranking: values.ranking
    };
}

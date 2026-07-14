export function createInitialAnalysisContext(source, options) {
    return {
        source: {
            name: source?.name || "Imported dataset",
            worksheet: source?.worksheet || "",
            destination: source?.destination || null,
            headers: source?.headers || [],
            rows: source?.rows || [],
            importedAt: source?.importedAt || null
        },
        options: { maxCharts: options.maxCharts ?? 5 }
    };
}

export function createAnalysisResult(context) {
    return {
        source: context.source,
        options: context.options,
        dataset: context.dataset,
        executive: context.executive,
        numericProfiles: context.numericProfiles,
        kpis: context.kpis,
        charts: context.charts,
        qualityFindings: context.qualityFindings,
        insights: context.insights
    };
}

import { CategoryAnalyzer } from "./analyzers/CategoryAnalyzer.js";
import { DataQualityAnalyzer } from "./analyzers/DataQualityAnalyzer.js";
import { DatasetAnalyzer } from "./analyzers/DatasetAnalyzer.js";
import { InsightAnalyzer } from "./analyzers/InsightAnalyzer.js";
import { KPIAnalyzer } from "./analyzers/KPIAnalyzer.js";
import { OutlierAnalyzer } from "./analyzers/OutlierAnalyzer.js";
import { RelationshipAnalyzer } from "./analyzers/RelationshipAnalyzer.js";
import { TrendAnalyzer } from "./analyzers/TrendAnalyzer.js";
import { ChartGenerator } from "./charts/ChartGenerator.js";
import { ChartRanker } from "./charts/ChartRanker.js";
import { BusinessAnalysisEngine } from "./engine/BusinessAnalysisEngine.js";
import { createInitialAnalysisContext } from "./models/AnalysisResult.js";
import { AnalysisPipeline } from "./services/AnalysisPipeline.js";

export { BusinessAnalysisEngine } from "./engine/BusinessAnalysisEngine.js";
export { AnalysisPipeline } from "./services/AnalysisPipeline.js";
export { formatCompactNumber } from "./utils/NumberFormat.js";
export { isEmptyValue, parseDate, parseNumber } from "./utils/ValueParsers.js";

const datasetAnalyzer = new DatasetAnalyzer();
const kpiAnalyzer = new KPIAnalyzer();
const trendAnalyzer = new TrendAnalyzer();
const categoryAnalyzer = new CategoryAnalyzer();
const relationshipAnalyzer = new RelationshipAnalyzer();
const dataQualityAnalyzer = new DataQualityAnalyzer();
const outlierAnalyzer = new OutlierAnalyzer();
const chartGenerator = new ChartGenerator();
const chartRanker = new ChartRanker();
const insightAnalyzer = new InsightAnalyzer();

// Compatibility stage exports keep Task 007 callers working while all behavior
// now lives in focused analyzers registered through AnalysisPipeline.
export function datasetUnderstandingStage(context) {
    return datasetAnalyzer.profile(context);
}

export function metricGenerationStage(context) {
    const summarized = context.executive ? context : datasetAnalyzer.summarize(context);
    return kpiAnalyzer.analyze(summarized);
}

export function chartGenerationStage(context) {
    const withTrends = trendAnalyzer.analyze(context);
    const withCategories = categoryAnalyzer.analyze(withTrends);
    const withRelationships = relationshipAnalyzer.analyze(withCategories);
    const generated = chartGenerator.analyze(withRelationships);
    const ranked = chartRanker.analyze(generated);
    return { ...context, charts: ranked.charts };
}

export function qualityAnalysisStage(context) {
    const quality = dataQualityAnalyzer.analyze(context);
    const outliers = outlierAnalyzer.analyze(quality);
    return { ...context, qualityFindings: outliers.qualityFindings };
}

export function insightGenerationStage(context) {
    return insightAnalyzer.analyze(context);
}

export const DEFAULT_ANALYSIS_STAGES = [
    datasetUnderstandingStage,
    metricGenerationStage,
    chartGenerationStage,
    qualityAnalysisStage,
    insightGenerationStage
];

export function analyzeDataset(source, options = {}) {
    if (options.stages) {
        return new AnalysisPipeline(options.stages).run(createInitialAnalysisContext(source, options));
    }
    return new BusinessAnalysisEngine().analyze(source, options);
}

import { CategoryAnalyzer } from "../analyzers/CategoryAnalyzer.js";
import { CrossCategoryAnalyzer } from "../analyzers/CrossCategoryAnalyzer.js";
import { DataQualityAnalyzer } from "../analyzers/DataQualityAnalyzer.js";
import { DatasetAnalyzer } from "../analyzers/DatasetAnalyzer.js";
import { DistributionAnalyzer } from "../analyzers/DistributionAnalyzer.js";
import { InsightAnalyzer } from "../analyzers/InsightAnalyzer.js";
import { KPIAnalyzer } from "../analyzers/KPIAnalyzer.js";
import { OutlierAnalyzer } from "../analyzers/OutlierAnalyzer.js";
import { PerformanceAnalyzer } from "../analyzers/PerformanceAnalyzer.js";
import { RelationshipAnalyzer } from "../analyzers/RelationshipAnalyzer.js";
import { TrendAnalyzer } from "../analyzers/TrendAnalyzer.js";
import { ChartGenerator } from "../charts/ChartGenerator.js";
import { ChartRanker } from "../charts/ChartRanker.js";
import { createAnalysisResult, createInitialAnalysisContext } from "../models/AnalysisResult.js";
import { AnalysisPipeline } from "../services/AnalysisPipeline.js";

export function createDefaultAnalysisStages() {
    return [
        new DatasetAnalyzer(),
        new KPIAnalyzer(),
        new TrendAnalyzer(),
        new CategoryAnalyzer(),
        new CrossCategoryAnalyzer(),
        new RelationshipAnalyzer(),
        new PerformanceAnalyzer(),
        new DistributionAnalyzer(),
        new DataQualityAnalyzer(),
        new OutlierAnalyzer(),
        new ChartGenerator(),
        new ChartRanker(),
        new InsightAnalyzer()
    ];
}

export class BusinessAnalysisEngine {
    constructor(pipeline = new AnalysisPipeline(createDefaultAnalysisStages())) {
        this.pipeline = pipeline;
    }

    analyze(source, options = {}) {
        const context = this.pipeline.run(createInitialAnalysisContext(source, options));
        return createAnalysisResult(context);
    }
}

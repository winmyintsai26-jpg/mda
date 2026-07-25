import { useMemo } from "react";

import { BusinessAnalysisEngine } from "../../business-analysis/engine/BusinessAnalysisEngine.js";

const engine = new BusinessAnalysisEngine();

export function useAiAnalysisContext(importedDataset) {
    return useMemo(
        () => importedDataset ? engine.analyze(importedDataset, { maxCharts: 24 }) : null,
        [importedDataset]
    );
}

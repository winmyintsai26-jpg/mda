import { useMemo } from "react";

import { BusinessAnalysisEngine } from "../engine/BusinessAnalysisEngine.js";

const engine = new BusinessAnalysisEngine();

export function useBusinessAnalysis(importedDataset) {
    return useMemo(
        () => importedDataset ? engine.analyze(importedDataset) : null,
        [importedDataset]
    );
}

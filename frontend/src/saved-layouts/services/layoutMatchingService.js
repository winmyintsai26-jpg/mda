const DEFAULT_MINIMUM_ACCURACY = 72;

const normalize = (value) => String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const unique = (values) => [...new Set(values.filter(Boolean))];

const setSimilarity = (leftValues, rightValues) => {
    const left = new Set(leftValues.map(normalize).filter(Boolean));
    const right = new Set(rightValues.map(normalize).filter(Boolean));
    const union = new Set([...left, ...right]);

    if (union.size === 0) {
        return 1;
    }

    const intersectionSize = [...left].filter((value) => right.has(value)).length;
    return intersectionSize / union.size;
};

const sequenceSimilarity = (leftValues, rightValues) => {
    const left = leftValues.map(normalize).filter(Boolean);
    const right = rightValues.map(normalize).filter(Boolean);
    const length = Math.max(left.length, right.length);

    if (length === 0) {
        return 1;
    }

    let matchingPositions = 0;
    for (let index = 0; index < length; index += 1) {
        if (left[index] && left[index] === right[index]) {
            matchingPositions += 1;
        }
    }

    return matchingPositions / length;
};

const getCurrentWorksheetNames = (analysisTables) => unique(analysisTables.map((table) => table.worksheetName));

const getSavedHeaderCells = (layout) => layout.tableRegions.flatMap((tableRegion) => {
    const headerRows = Array.isArray(tableRegion.headerRow?.cells) ? tableRegion.headerRow.cells : [];
    return Array.isArray(headerRows.at(-1)) ? headerRows.at(-1) : [];
});

const getCurrentHeaders = (analysisTables) => analysisTables.flatMap((table) =>
    (table.headers || []).map((header) => header.name)
);

const findAddedAndRemoved = (savedValues, currentValues) => {
    const savedByKey = new Map(savedValues.map((value) => [normalize(value), value]).filter(([key]) => key));
    const currentByKey = new Map(currentValues.map((value) => [normalize(value), value]).filter(([key]) => key));

    return {
        added: [...currentByKey].filter(([key]) => !savedByKey.has(key)).map(([, value]) => value),
        removed: [...savedByKey].filter(([key]) => !currentByKey.has(key)).map(([, value]) => value)
    };
};

const worksheetNamesRule = {
    id: "worksheet-names",
    weight: 20,
    evaluate({ layout, analysisTables }) {
        const currentNames = getCurrentWorksheetNames(analysisTables);
        const changes = findAddedAndRemoved(layout.worksheetNames || [], currentNames);
        const differences = [
            ...changes.added.map((name) => `Worksheet added: ${name}`),
            ...changes.removed.map((name) => `Worksheet removed: ${name}`)
        ];

        return { score: setSimilarity(layout.worksheetNames || [], currentNames), differences };
    }
};

const worksheetCountRule = {
    id: "worksheet-count",
    weight: 10,
    evaluate({ layout, analysisTables }) {
        const savedCount = (layout.worksheetNames || []).length;
        const currentCount = getCurrentWorksheetNames(analysisTables).length;
        const denominator = Math.max(savedCount, currentCount, 1);
        return {
            score: 1 - (Math.abs(savedCount - currentCount) / denominator),
            differences: savedCount === currentCount ? [] : [`Worksheet count changed from ${savedCount} to ${currentCount}`]
        };
    }
};

const tableStructureRule = {
    id: "table-structure",
    weight: 15,
    evaluate({ layout, analysisTables }) {
        const savedRegions = layout.tableRegions || [];
        const denominator = Math.max(savedRegions.length, analysisTables.length, 1);
        const countScore = 1 - (Math.abs(savedRegions.length - analysisTables.length) / denominator);
        const savedWorksheetSequence = savedRegions.map((region) => region.worksheetName);
        const currentWorksheetSequence = analysisTables.map((table) => table.worksheetName);
        const score = (countScore + sequenceSimilarity(savedWorksheetSequence, currentWorksheetSequence)) / 2;

        return {
            score,
            differences: savedRegions.length === analysisTables.length
                ? []
                : [`Table region count changed from ${savedRegions.length} to ${analysisTables.length}`]
        };
    }
};

const regionCoordinatesRule = {
    id: "region-coordinates",
    weight: 10,
    evaluate({ layout, analysisTables }) {
        const savedRegions = layout.tableRegions || [];
        const pairCount = Math.min(savedRegions.length, analysisTables.length);
        if (pairCount === 0) {
            return { score: savedRegions.length === analysisTables.length ? 1 : 0, differences: [] };
        }

        let coordinateScore = 0;
        let changedRegions = 0;
        for (let index = 0; index < pairCount; index += 1) {
            const saved = savedRegions[index]?.region || {};
            const current = analysisTables[index]?.source || {};
            const comparisons = [
                [saved.startRow, current.startRow],
                [saved.endRow, current.endRow],
                [saved.startColumn, current.startColumn],
                [saved.endColumn, current.endColumn]
            ].filter(([left, right]) => Number.isFinite(left) && Number.isFinite(right));

            const exactCount = comparisons.filter(([left, right]) => left === right).length;
            const pairScore = comparisons.length > 0 ? exactCount / comparisons.length : 1;
            coordinateScore += pairScore;
            if (pairScore < 1) changedRegions += 1;
        }

        return {
            score: coordinateScore / pairCount,
            differences: changedRegions > 0 ? [`${changedRegions} table region${changedRegions === 1 ? "" : "s"} changed`] : []
        };
    }
};

const headerPositionRule = {
    id: "header-position",
    weight: 10,
    evaluate({ layout, analysisTables }) {
        const savedPositions = (layout.tableRegions || []).map((region) => region.headerRow?.startRow);
        const currentPositions = analysisTables.map((table) => table.source?.headerDetectionResult?.winningHeader?.headerStartRow);
        const length = Math.max(savedPositions.length, currentPositions.length, 1);
        let matches = 0;
        for (let index = 0; index < length; index += 1) {
            if (savedPositions[index] != null && savedPositions[index] === currentPositions[index]) matches += 1;
        }

        return {
            score: matches / length,
            differences: matches === length ? [] : ["Header row position changed"]
        };
    }
};

const columnNamesRule = {
    id: "column-names",
    weight: 25,
    evaluate({ layout, analysisTables }) {
        const savedHeaders = getSavedHeaderCells(layout);
        const currentHeaders = getCurrentHeaders(analysisTables);
        const changes = findAddedAndRemoved(savedHeaders, currentHeaders);
        const differences = [
            ...changes.added.slice(0, 2).map((name) => `New column detected: ${name}`),
            ...changes.removed.slice(0, 2).map((name) => `Missing column: ${name}`)
        ];

        return { score: setSimilarity(savedHeaders, currentHeaders), differences };
    }
};

const columnOrderRule = {
    id: "column-order",
    weight: 10,
    evaluate({ layout, analysisTables }) {
        const score = sequenceSimilarity(getSavedHeaderCells(layout), getCurrentHeaders(analysisTables));
        return { score, differences: score === 1 ? [] : ["Column order changed"] };
    }
};

export const defaultLayoutMatchingRules = [
    worksheetNamesRule,
    worksheetCountRule,
    tableStructureRule,
    regionCoordinatesRule,
    headerPositionRule,
    columnNamesRule,
    columnOrderRule
];

export class LayoutMatchingService {
    constructor(rules = defaultLayoutMatchingRules, minimumAccuracy = DEFAULT_MINIMUM_ACCURACY) {
        this.rules = rules;
        this.minimumAccuracy = minimumAccuracy;
    }

    scoreLayout(layout, analysisTables) {
        const ruleResults = this.rules.map((rule) => ({
            ...rule,
            ...rule.evaluate({ layout, analysisTables })
        }));
        const totalWeight = ruleResults.reduce((sum, rule) => sum + rule.weight, 0) || 1;
        const weightedScore = ruleResults.reduce((sum, rule) => sum + (rule.score * rule.weight), 0);
        const accuracy = Math.round((weightedScore / totalWeight) * 100);
        const differences = unique(ruleResults.flatMap((rule) => rule.differences || [])).slice(0, 5);

        return {
            layout,
            accuracy,
            differences: differences.length > 0 ? differences : ["Workbook structure unchanged"],
            scoreBreakdown: ruleResults.map((rule) => ({ id: rule.id, score: Math.round(rule.score * 100), weight: rule.weight }))
        };
    }

    findBestMatch(layouts, analysisTables) {
        const candidates = layouts
            .filter((layout) => layout?.schemaVersion === 1)
            .map((layout) => this.scoreLayout(layout, analysisTables))
            .sort((left, right) => right.accuracy - left.accuracy);
        const bestMatch = candidates[0] || null;

        return bestMatch && bestMatch.accuracy >= this.minimumAccuracy ? bestMatch : null;
    }
}

export const layoutMatchingService = new LayoutMatchingService();

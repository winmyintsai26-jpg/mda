import { selectRelationshipProfiles } from "../utils/ColumnHelpers.js";
import { pearsonCorrelation } from "../utils/Statistics.js";

export class RelationshipAnalyzer {
    analyze(context) {
        const profiles = selectRelationshipProfiles(context.dataset.profiles);
        const relationships = [];

        for (let leftIndex = 0; leftIndex < profiles.length; leftIndex++) {
            for (let rightIndex = leftIndex + 1; rightIndex < profiles.length; rightIndex++) {
                const relationship = this.createRelationship(profiles[leftIndex], profiles[rightIndex]);
                if (relationship) relationships.push(relationship);
            }
        }

        return { ...context, relationships };
    }

    createRelationship(left, right) {
        const rightByRow = new Map(right.numericValues.map((item) => [item.rowIndex, item.value]));
        const data = left.numericValues
            .filter((item) => rightByRow.has(item.rowIndex))
            .slice(0, 250)
            .map((item) => ({ x: item.value, y: rightByRow.get(item.rowIndex), rowIndices: [item.rowIndex] }));
        const correlation = pearsonCorrelation(data);

        if (data.length < 4 || Math.abs(correlation) < 0.45) return null;
        return { left, right, data, correlation };
    }
}

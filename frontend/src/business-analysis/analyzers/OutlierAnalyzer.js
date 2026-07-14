import { quantile } from "../utils/Statistics.js";

const SEVERITY_RANK = { high: 3, medium: 2, info: 1 };

export class OutlierAnalyzer {
    analyze(context) {
        const findings = [...context.qualityFindings];

        context.dataset.profiles.forEach((profile) => {
            const baseOrder = profile.index * 10;
            if (profile.kind === "numeric" && profile.numericValues.length >= 4) {
                const sorted = profile.numericValues.map((item) => item.value).sort((left, right) => left - right);
                const q1 = quantile(sorted, 0.25);
                const q3 = quantile(sorted, 0.75);
                const iqr = q3 - q1;
                const lower = q1 - 1.5 * iqr;
                const upper = q3 + 1.5 * iqr;
                const outliers = profile.numericValues.filter((item) => item.value < lower || item.value > upper);

                if (outliers.length > 0 && outliers.length < profile.numericValues.length / 2) {
                    findings.push({ id: `outlier-${profile.id}`, severity: "medium", title: `${outliers.length} unusual ${profile.name} values`, detail: "These records fall outside the typical range and are worth reviewing; they are not automatically errors.", rowIndices: outliers.map((item) => item.rowIndex), _order: baseOrder + 3 });
                }
            }

            if (profile.kind === "categorical") {
                const rare = [...profile.uniqueValues.entries()].filter(([, count]) => count === 1);
                if (rare.length > 0 && rare.length <= 10) {
                    const rareValues = new Set(rare.map(([value]) => value));
                    findings.push({ id: `rare-${profile.id}`, severity: "info", title: `${rare.length} rare ${profile.name} values`, detail: "These categories appear only once and may represent exceptions worth investigating.", rowIndices: context.dataset.rows.filter((row) => rareValues.has(String(row.values[profile.index]).trim())).map((row) => row.rowIndex), _order: baseOrder + 5 });
                }
            }
        });

        const qualityFindings = findings
            .sort((left, right) => SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity] || right.rowIndices.length - left.rowIndices.length || left._order - right._order)
            .map((finding) => {
                const result = { ...finding };
                delete result._order;
                return result;
            });

        return { ...context, qualityFindings };
    }
}

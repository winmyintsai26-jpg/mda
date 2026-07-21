export class ChartSelector {
    select(charts, maximum) {
        const selected = [];
        charts
            .sort((left, right) => right.score - left.score)
            .forEach((chart) => {
                if (selected.length >= maximum || chart.score < 0.55) return;
                const signature = this.signature(chart);
                if (selected.some((candidate) => this.signature(candidate) === signature || candidate.question === chart.question)) return;
                selected.push(chart);
            });
        return selected;
    }

    signature(chart) {
        const columns = [chart.meta?.dateColumn, chart.meta?.categoryColumn, chart.meta?.seriesColumn, chart.meta?.xColumn, chart.meta?.yColumn, chart.meta?.valueColumn, ...(chart.meta?.seriesColumns || [])]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase())
            .sort();
        return `${chart.type}:${columns.join("|")}`;
    }
}

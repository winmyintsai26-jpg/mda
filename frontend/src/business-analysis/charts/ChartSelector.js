export class ChartSelector {
    select(charts, maximum) {
        return charts
            .sort((left, right) => right.score - left.score)
            .filter((chart, index, all) => all.findIndex((candidate) => candidate.title === chart.title) === index)
            .slice(0, maximum);
    }
}

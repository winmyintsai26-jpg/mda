const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function formatNumber(value) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}
function formatDate(value) {
    const match = String(value ?? "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (match) {
        const [, year, month, day = "01"] = match;
        return dateFormatter.format(new Date(Number(year), Number(month) - 1, Number(day)));
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value ?? "") : dateFormatter.format(date);
}

function dateContext(dataset, rowIndices) {
    const profile = dataset?.profiles?.find((candidate) => candidate.kind === "date");
    if (!profile) return null;

    const selectedRows = new Set(rowIndices || []);
    const dates = profile.dateValues
        .filter((item) => selectedRows.has(item.rowIndex))
        .map((item) => item.value)
        .sort((left, right) => left - right);
    if (!dates.length) return null;

    const start = formatDate(dates[0]);
    const end = formatDate(dates.at(-1));
    return { label: dates.length > 1 && start !== end ? "Date range" : "Date", value: start === end ? start : `${start} – ${end}` };
}

export function createChartInteraction(chart, item, dataset) {
    const rowIndices = [...new Set(item.rowIndices || [])];
    const fields = [];
    let selectionLabel;

    if (["groupedBar", "stackedBar"].includes(chart.type)) {
        fields.push({ label: chart.meta?.categoryColumn || "Category", value: item.categoryLabel || item.label });
        fields.push({ label: chart.meta?.seriesColumn || "Series", value: item.seriesLabel || "Value" });
        fields.push({ label: chart.meta?.valueColumn || "Value", value: formatNumber(item.value) });
        selectionLabel = `${item.categoryLabel || item.label} · ${item.seriesLabel || "Value"}`;
    } else if (chart.type === "scatter") {
        const xLabel = chart.meta?.xColumn || "X value";
        const yLabel = chart.meta?.yColumn || "Y value";
        fields.push({ label: xLabel, value: formatNumber(item.x) });
        fields.push({ label: yLabel, value: formatNumber(item.y) });
        selectionLabel = `${xLabel}: ${formatNumber(item.x)} · ${yLabel}: ${formatNumber(item.y)}`;
    } else if (["line", "area"].includes(chart.type)) {
        const date = formatDate(item.label);
        fields.push({ label: chart.meta?.dateColumn || "Date", value: date });
        fields.push({ label: chart.meta?.valueColumn || "Value", value: formatNumber(item.value) });
        selectionLabel = date;
    } else {
        const label = String(item.label ?? "Selected value");
        fields.push({ label: chart.meta?.categoryColumn || "Category", value: label });
        fields.push({ label: chart.meta?.valueColumn || "Value", value: formatNumber(item.value) });
        selectionLabel = label;
    }

    if (!["line", "area"].includes(chart.type)) {
        const date = dateContext(dataset, rowIndices);
        if (date) fields.push(date);
    }
    fields.push({ label: "Record count", value: formatNumber(rowIndices.length) });

    return { title: chart.title, selectionLabel, rowIndices, fields };
}

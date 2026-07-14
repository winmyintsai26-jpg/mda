import { useState } from "react";
import { Link } from "react-router-dom";

import { useUpload } from "../../context/UploadContext";
import { formatCompactNumber } from "../../business-analysis/analysisEngine";
import { useBusinessAnalysis } from "../../business-analysis/services/useBusinessAnalysis";
import "../../business-analysis/business-analysis.css";

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function formatValue(value, format) {
    if (format === "percent") return percentFormatter.format(value);
    if (format === "integer") return numberFormatter.format(Math.round(value));
    return formatCompactNumber(value);
}

function uniqueRows(chart) {
    return [...new Set(chart.data.flatMap((item) => item.rowIndices || []))];
}

function BarChart({ chart, onDrillDown }) {
    const maximum = Math.max(...chart.data.map((item) => Math.abs(item.value)), 1);

    return (
        <div className="mda-analysis-bar-chart" aria-label={chart.title}>
            {chart.data.map((item) => (
                <button type="button" key={item.label} onClick={() => onDrillDown(item.rowIndices, `${chart.title}: ${item.label}`)}>
                    <span className="mda-analysis-bar-label" title={item.label}>{item.label}</span>
                    <span className="mda-analysis-bar-track">
                        <span style={{ width: `${Math.max(3, (Math.abs(item.value) / maximum) * 100)}%` }} />
                    </span>
                    <strong>{formatCompactNumber(item.value)}</strong>
                </button>
            ))}
        </div>
    );
}

function LineChart({ chart }) {
    const width = 620;
    const height = 210;
    const padding = 24;
    const values = chart.data.map((item) => item.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const span = maximum - minimum || 1;
    const points = chart.data.map((item, index) => ({
        ...item,
        x: padding + (index / Math.max(chart.data.length - 1, 1)) * (width - padding * 2),
        y: height - padding - ((item.value - minimum) / span) * (height - padding * 2)
    }));
    const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

    return (
        <div className="mda-analysis-line-chart" aria-label={chart.title}>
            <svg viewBox={`0 0 ${width} ${height}`} role="img">
                <title>{chart.title}</title>
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
                <polyline points={polyline} />
                {points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="5" />)}
            </svg>
            <div className="mda-analysis-axis-labels"><span>{chart.data[0]?.label}</span><span>{chart.data.at(-1)?.label}</span></div>
        </div>
    );
}

function ScatterChart({ chart }) {
    const width = 620;
    const height = 210;
    const padding = 24;
    const xValues = chart.data.map((item) => item.x);
    const yValues = chart.data.map((item) => item.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    return (
        <div className="mda-analysis-line-chart mda-analysis-scatter-chart" aria-label={chart.title}>
            <svg viewBox={`0 0 ${width} ${height}`} role="img">
                <title>{chart.title}</title>
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
                {chart.data.map((point, index) => {
                    const x = padding + ((point.x - minX) / (maxX - minX || 1)) * (width - padding * 2);
                    const y = height - padding - ((point.y - minY) / (maxY - minY || 1)) * (height - padding * 2);
                    return <circle key={`${point.x}-${point.y}-${index}`} cx={x} cy={y} r="5" />;
                })}
            </svg>
            <div className="mda-analysis-axis-labels"><span>{chart.meta.xColumn}</span><span>{chart.meta.yColumn}</span></div>
        </div>
    );
}

function Chart({ chart, onDrillDown }) {
    return (
        <article className="mda-analysis-chart-card">
            <button type="button" className="mda-analysis-chart-heading" onClick={() => onDrillDown(uniqueRows(chart), chart.title)}>
                <span>
                    <small>Business question</small>
                    <strong>{chart.question}</strong>
                </span>
                <span className="mda-analysis-score">Priority {Math.round(chart.score * 100)}</span>
            </button>
            <div className="mda-analysis-chart-title"><h3>{chart.title}</h3><p>{chart.subtitle}</p></div>
            {chart.type === "bar" && <BarChart chart={chart} onDrillDown={onDrillDown} />}
            {chart.type === "line" && <LineChart chart={chart} />}
            {chart.type === "scatter" && <ScatterChart chart={chart} />}
            <button type="button" className="mda-analysis-drill-link" onClick={() => onDrillDown(uniqueRows(chart), chart.title)}>
                Inspect {uniqueRows(chart).length} underlying rows <span>→</span>
            </button>
        </article>
    );
}

function DrillDown({ selection, analysis, onClose }) {
    if (!selection) return null;
    const rows = selection.rowIndices.map((rowIndex) => analysis.dataset.rows[rowIndex]).filter(Boolean);

    return (
        <div className="mda-analysis-drawer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <aside className="mda-analysis-drawer" role="dialog" aria-modal="true" aria-labelledby="mda-analysis-drawer-title">
                <header>
                    <div><p>Underlying data</p><h2 id="mda-analysis-drawer-title">{selection.title}</h2><span>{rows.length} matching row{rows.length === 1 ? "" : "s"}</span></div>
                    <button type="button" onClick={onClose} aria-label="Close underlying data">×</button>
                </header>
                <div className="mda-analysis-row-table-wrap">
                    <table>
                        <thead><tr><th>Source row</th>{analysis.dataset.columns.map((column) => <th key={column.id}>{column.name}</th>)}</tr></thead>
                        <tbody>
                            {rows.slice(0, 250).map((row) => (
                                <tr key={row.rowIndex}><td>{row.rowIndex + 1}</td>{row.values.map((value, index) => <td key={`${row.rowIndex}-${analysis.dataset.columns[index].id}`}>{String(value ?? "") || <span className="mda-analysis-empty-value">Empty</span>}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {rows.length > 250 && <p className="mda-analysis-row-limit">Showing the first 250 matching rows.</p>}
            </aside>
        </div>
    );
}

function Analytics() {
    const { importedDataset } = useUpload();
    const [drillDown, setDrillDown] = useState(null);
    const analysis = useBusinessAnalysis(importedDataset);

    const openRows = (rowIndices, title) => setDrillDown({ rowIndices: [...new Set(rowIndices)], title });

    const exportSummary = () => {
        const report = {
            dataset: analysis.source,
            executiveSummary: analysis.executive,
            keyMetrics: analysis.kpis,
            prioritizedCharts: analysis.charts.map(({ id, type, title, question, score, data }) => ({ id, type, title, question, score, data })),
            insights: analysis.insights,
            dataQuality: analysis.qualityFindings
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${analysis.source.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-analysis.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    if (!analysis) {
        return (
            <section className="mda-app-page mda-analysis-empty-page">
                <div className="mda-analysis-empty-card">
                    <span aria-hidden="true">↗</span>
                    <p>Business Analysis</p>
                    <h1>Import a dataset to reveal what matters.</h1>
                    <div>MDA analyzes the exact validated rows after import, then prioritizes useful metrics, trends, distributions, exceptions, and data-quality findings.</div>
                    <Link to="/upload">Upload Workbook</Link>
                </div>
            </section>
        );
    }

    const summaryItems = [
        { label: "Records", value: numberFormatter.format(analysis.executive.recordCount) },
        { label: "Columns", value: numberFormatter.format(analysis.executive.columnCount) },
        { label: "Completeness", value: percentFormatter.format(analysis.executive.completeness) },
        { label: "Missing values", value: numberFormatter.format(analysis.executive.missingValueCount) },
        { label: "Duplicate records", value: numberFormatter.format(analysis.executive.duplicateCount) },
        { label: "Unique categories", value: numberFormatter.format(analysis.executive.categoryCount) }
    ];

    return (
        <section className="mda-app-page mda-analysis-page">
            <header className="mda-analysis-hero">
                <div>
                    <p>Business Analysis</p>
                    <h1>What you should know about <span>{analysis.source.name}</span></h1>
                    <div className="mda-analysis-source-line">
                        {analysis.source.worksheet && <span>{analysis.source.worksheet}</span>}
                        {analysis.source.destination && <span>{analysis.source.destination.database}.{analysis.source.destination.table}</span>}
                        {analysis.source.importedAt && <span>Imported {dateFormatter.format(new Date(analysis.source.importedAt))}</span>}
                    </div>
                </div>
                <div className="mda-analysis-export-actions">
                    <button type="button" onClick={() => window.print()}>Print report</button>
                    <button type="button" className="primary" onClick={exportSummary}>Export summary</button>
                </div>
            </header>

            <section className="mda-analysis-section" aria-labelledby="executive-summary-heading">
                <div className="mda-analysis-section-heading">
                    <div><p>01 · Dataset health</p><h2 id="executive-summary-heading">Executive Summary</h2></div>
                    {analysis.executive.dateRange && <span>{dateFormatter.format(analysis.executive.dateRange.start)} — {dateFormatter.format(analysis.executive.dateRange.end)}</span>}
                </div>
                <div className="mda-analysis-summary-grid">
                    {summaryItems.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}
                </div>
            </section>

            <section className="mda-analysis-section" aria-labelledby="key-metrics-heading">
                <div className="mda-analysis-section-heading"><div><p>02 · Decision signals</p><h2 id="key-metrics-heading">Key Metrics</h2></div><span>Selected automatically from the strongest numeric signals</span></div>
                <div className="mda-analysis-kpi-grid">
                    {analysis.kpis.map((kpi) => (
                        <button type="button" key={kpi.id} onClick={() => openRows(kpi.rowIndices, kpi.label)}>
                            <small>{kpi.question}</small><span>{kpi.label}</span><strong>{formatValue(kpi.value, kpi.format)}</strong>{kpi.secondary && <em>{kpi.secondary}</em>}<b>Inspect rows →</b>
                        </button>
                    ))}
                </div>
            </section>

            {analysis.insights.length > 0 && (
                <section className="mda-analysis-section" aria-labelledby="insights-heading">
                    <div className="mda-analysis-section-heading"><div><p>03 · Worth investigating</p><h2 id="insights-heading">Key Findings</h2></div><span>Deterministic explanations—no AI required</span></div>
                    <div className="mda-analysis-insight-grid">
                        {analysis.insights.map((insight, index) => (
                            <button type="button" key={insight.id} onClick={() => openRows(insight.rowIndices, insight.title)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{insight.title}</strong><p>{insight.text}</p></div><b>→</b></button>
                        ))}
                    </div>
                </section>
            )}

            <section className="mda-analysis-section" aria-labelledby="visual-analysis-heading">
                <div className="mda-analysis-section-heading"><div><p>04 · Ranked by usefulness</p><h2 id="visual-analysis-heading">Visual Analysis</h2></div><span>Every chart answers a business question</span></div>
                {analysis.charts.length > 0 ? (
                    <div className="mda-analysis-chart-grid">{analysis.charts.map((chart) => <Chart key={chart.id} chart={chart} onDrillDown={openRows} />)}</div>
                ) : (
                    <div className="mda-analysis-no-charts"><strong>No decision-useful chart was found.</strong><p>MDA intentionally skipped generic visualizations because this dataset does not contain enough variation, dates, categories, or numeric relationships.</p></div>
                )}
            </section>

            <section className="mda-analysis-section" aria-labelledby="quality-heading">
                <div className="mda-analysis-section-heading"><div><p>05 · Trust and exceptions</p><h2 id="quality-heading">Data Quality & Exceptions</h2></div><span>{analysis.qualityFindings.length} observation{analysis.qualityFindings.length === 1 ? "" : "s"}</span></div>
                {analysis.qualityFindings.length > 0 ? (
                    <div className="mda-analysis-quality-list">
                        {analysis.qualityFindings.map((finding) => (
                            <button type="button" key={finding.id} onClick={() => openRows(finding.rowIndices, finding.title)}><i className={finding.severity} /><span><strong>{finding.title}</strong><p>{finding.detail}</p></span><b>{finding.rowIndices.length > 0 ? `${finding.rowIndices.length} rows →` : "Review →"}</b></button>
                        ))}
                    </div>
                ) : <div className="mda-analysis-no-charts"><strong>No material quality issues detected.</strong><p>The imported data is complete enough for the available analysis.</p></div>}
            </section>

            <DrillDown selection={drillDown} analysis={analysis} onClose={() => setDrillDown(null)} />
        </section>
    );
}

export default Analytics;

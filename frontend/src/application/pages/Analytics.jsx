import { useState } from "react";
import { Link } from "react-router-dom";

import { formatCompactNumber } from "../../business-analysis/analysisEngine";
import { createExecutiveAnalysisViewModel } from "../../business-analysis/services/createExecutiveAnalysisViewModel";
import { useBusinessAnalysis } from "../../business-analysis/services/useBusinessAnalysis";
import { useUpload } from "../../context/UploadContext";
import "../../business-analysis/business-analysis.css";

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function uniqueRows(chart) {
    return [...new Set(chart.data.flatMap((item) => item.rowIndices || []))];
}

function formatDateRange(dateRange) {
    if (!dateRange) return "Not available";
    return `${dateFormatter.format(dateRange.start)} – ${dateFormatter.format(dateRange.end)}`;
}

function BarChart({ chart, onDrillDown }) {
    const maximum = Math.max(...chart.data.map((item) => Math.abs(item.value)), 1);

    return (
        <div className="mda-analysis-bar-chart" aria-label={chart.title}>
            {chart.data.map((item) => (
                <button type="button" key={item.label} onClick={() => onDrillDown(item.rowIndices, `${chart.title}: ${item.label}`)}>
                    <span className="mda-analysis-bar-label" title={item.label}>{item.label}</span>
                    <span className="mda-analysis-bar-track"><span style={{ width: `${Math.max(3, (Math.abs(item.value) / maximum) * 100)}%` }} /></span>
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

    return (
        <div className="mda-analysis-line-chart" aria-label={chart.title}>
            <svg viewBox={`0 0 ${width} ${height}`} role="img">
                <title>{chart.title}</title>
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
                <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
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
    const rowIndices = uniqueRows(chart);
    return (
        <article className="mda-analysis-chart-card">
            <div className="mda-analysis-chart-heading">
                <span><small>Question answered</small><strong>{chart.question}</strong></span>
                <span className="mda-analysis-score">Evidence {Math.round(chart.score * 100)}</span>
            </div>
            <div className="mda-analysis-chart-title"><h3>{chart.title}</h3><p>{chart.subtitle}</p></div>
            {chart.type === "bar" && <BarChart chart={chart} onDrillDown={onDrillDown} />}
            {chart.type === "line" && <LineChart chart={chart} />}
            {chart.type === "scatter" && <ScatterChart chart={chart} />}
            <button type="button" className="mda-analysis-drill-link" onClick={() => onDrillDown(rowIndices, chart.title)}>
                View supporting records <span>→</span>
            </button>
        </article>
    );
}

function DataTable({ dataset, rowIndices, limit = 100 }) {
    const rows = rowIndices
        ? rowIndices.map((rowIndex) => dataset.rows[rowIndex]).filter(Boolean)
        : dataset.rows;

    return (
        <>
            <div className="mda-analysis-row-table-wrap">
                <table>
                    <thead><tr><th>Source row</th>{dataset.columns.map((column) => <th key={column.id}>{column.name}</th>)}</tr></thead>
                    <tbody>
                        {rows.slice(0, limit).map((row) => (
                            <tr key={row.rowIndex}>
                                <td>{row.rowIndex + 1}</td>
                                {row.values.map((value, index) => <td key={`${row.rowIndex}-${dataset.columns[index].id}`}>{String(value ?? "") || <span className="mda-analysis-empty-value">Empty</span>}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {rows.length > limit && <p className="mda-analysis-row-limit">Showing the first {limit} of {numberFormatter.format(rows.length)} rows.</p>}
        </>
    );
}

function DrillDown({ selection, analysis, onClose }) {
    if (!selection) return null;

    return (
        <div className="mda-analysis-drawer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <aside className="mda-analysis-drawer" role="dialog" aria-modal="true" aria-labelledby="mda-analysis-drawer-title">
                <header>
                    <div>
                        <p>Underlying data</p>
                        <h2 id="mda-analysis-drawer-title">{selection.title}</h2>
                        <span>{selection.rowIndices.length} matching row{selection.rowIndices.length === 1 ? "" : "s"}</span>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close underlying data"><span aria-hidden="true">×</span></button>
                </header>
                <DataTable dataset={analysis.dataset} rowIndices={selection.rowIndices} limit={250} />
            </aside>
        </div>
    );
}

function InvestigationPanel({ id, title, description, count, isOpen, onToggle, children }) {
    return (
        <section className={`mda-analysis-accordion${isOpen ? " is-open" : ""}`}>
            <button type="button" className="mda-analysis-accordion-toggle" onClick={() => onToggle(id)} aria-expanded={isOpen} aria-controls={`${id}-content`}>
                <span className="mda-analysis-accordion-chevron" aria-hidden="true">›</span>
                <span><strong>{title}</strong><small>{description}</small></span>
                {count != null && <b>{count}</b>}
            </button>
            <div className="mda-analysis-accordion-animation" id={`${id}-content`} aria-hidden={!isOpen}>
                <div><div className="mda-analysis-accordion-content">{children}</div></div>
            </div>
        </section>
    );
}

function Analytics() {
    const { importedDataset } = useUpload();
    const [drillDown, setDrillDown] = useState(null);
    const [openSections, setOpenSections] = useState(() => new Set());
    const analysis = useBusinessAnalysis(importedDataset);
    const viewModel = createExecutiveAnalysisViewModel(analysis);

    const openRows = (rowIndices, title) => setDrillDown({ rowIndices: [...new Set(rowIndices)], title });
    const toggleSection = (sectionId) => setOpenSections((current) => {
        const next = new Set(current);
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        return next;
    });

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

    if (!analysis || !viewModel) {
        return (
            <section className="mda-app-page mda-analysis-empty-page">
                <div className="mda-analysis-empty-card">
                    <span aria-hidden="true">↗</span><p>Business Analysis</p><h1>Import a dataset to reveal what matters.</h1>
                    <div>MDA analyzes the exact validated rows after import, then prioritizes useful metrics, trends, distributions, exceptions, and data-quality findings.</div>
                    <Link to="/upload">Upload Workbook</Link>
                </div>
            </section>
        );
    }

    const summaryItems = [
        { label: "Total records", value: numberFormatter.format(viewModel.summary.recordCount) },
        { label: "Total columns", value: numberFormatter.format(viewModel.summary.columnCount) },
        { label: "Data completeness", value: percentFormatter.format(viewModel.summary.completeness), tone: "positive" },
        { label: "Important categories", value: numberFormatter.format(viewModel.summary.categoryCount) },
        { label: "Date range", value: formatDateRange(viewModel.summary.dateRange), wide: true },
        { label: "Duplicate records", value: numberFormatter.format(viewModel.summary.duplicateCount), tone: viewModel.summary.duplicateCount ? "warning" : "positive" },
        { label: "Missing values", value: numberFormatter.format(viewModel.summary.missingValueCount), tone: viewModel.summary.missingValueCount ? "warning" : "positive" }
    ];

    return (
        <section className="mda-app-page mda-analysis-page">
            <header className="mda-analysis-hero">
                <div>
                    <p>Business Analysis</p>
                    <h1>Analysis Results</h1>
                    <div className="mda-analysis-source-line">
                        <span>Table · {viewModel.source.name}</span>
                        {viewModel.source.worksheet && <span>Worksheet · {viewModel.source.worksheet}</span>}
                        {viewModel.source.destination && <span>Database · {viewModel.source.destination.database}.{viewModel.source.destination.table}</span>}
                        {viewModel.source.importedAt && <span>Imported · {dateFormatter.format(new Date(viewModel.source.importedAt))}</span>}
                    </div>
                </div>
                <div className="mda-analysis-export-actions">
                    <button type="button" onClick={() => window.print()}>Print report</button>
                    <button type="button" className="primary" onClick={exportSummary}>Export summary</button>
                </div>
            </header>

            <section className="mda-analysis-level-card" aria-labelledby="executive-summary-heading">
                <div className="mda-analysis-section-heading">
                    <div><p>01 · What happened?</p><h2 id="executive-summary-heading">Executive Summary</h2></div>
                    <span>A ten-second overview of the imported dataset</span>
                </div>
                <div className="mda-analysis-summary-grid">
                    {summaryItems.map((item) => <article className={`${item.wide ? "is-wide " : ""}${item.tone ? `is-${item.tone}` : ""}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}
                </div>
            </section>

            <section className="mda-analysis-level-card mda-analysis-findings-level" aria-labelledby="findings-heading">
                <div className="mda-analysis-section-heading">
                    <div><p>02 · Why does it matter?</p><h2 id="findings-heading">Key Findings</h2></div>
                    <span>Ranked by decision importance</span>
                </div>
                {viewModel.findings.length > 0 ? (
                    <div className="mda-analysis-finding-list">
                        {viewModel.findings.map((finding, index) => (
                            <article key={finding.id}>
                                <span className="mda-analysis-finding-number">{String(index + 1).padStart(2, "0")}</span>
                                <div><strong>{finding.title}</strong><p>{finding.text}</p></div>
                                <span className={`mda-analysis-importance is-${finding.importanceTone}`}>{finding.importanceLabel}</span>
                                {finding.rowIndices.length > 0 && <button type="button" onClick={() => openRows(finding.rowIndices, finding.title)}>View details <span>→</span></button>}
                            </article>
                        ))}
                    </div>
                ) : <div className="mda-analysis-no-charts"><strong>No material findings need attention.</strong><p>The current dataset did not produce a high-value exception or business observation.</p></div>}
                {viewModel.additionalFindingCount > 0 && <p className="mda-analysis-more-findings">{viewModel.additionalFindingCount} additional finding{viewModel.additionalFindingCount === 1 ? " is" : "s are"} available in the investigation panels below.</p>}
            </section>

            <section className="mda-analysis-level-card" aria-labelledby="visual-evidence-heading">
                <div className="mda-analysis-section-heading">
                    <div><p>03 · Show me the evidence.</p><h2 id="visual-evidence-heading">Visual Evidence</h2></div>
                    <span>Only charts selected by the existing ranking engine</span>
                </div>
                {viewModel.charts.length > 0
                    ? <div className="mda-analysis-chart-grid">{viewModel.charts.map((chart) => <Chart key={chart.id} chart={chart} onDrillDown={openRows} />)}</div>
                    : <div className="mda-analysis-no-charts"><strong>No decision-useful chart was found.</strong><p>MDA intentionally skipped generic visualizations that would not help explain this dataset.</p></div>}
            </section>

            <section className="mda-analysis-level-card" aria-labelledby="investigate-heading">
                <div className="mda-analysis-section-heading">
                    <div><p>04 · Let me investigate.</p><h2 id="investigate-heading">Investigate Further</h2></div>
                    <span>Technical details stay collapsed until needed</span>
                </div>
                <div className="mda-analysis-accordion-list">
                    <InvestigationPanel id="trust" title="Trust & Exceptions" description="Missing data, duplicates, outliers, and unusual observations" count={viewModel.qualityFindings.length} isOpen={openSections.has("trust")} onToggle={toggleSection}>
                        {viewModel.qualityFindings.length > 0 ? <div className="mda-analysis-quality-list">{viewModel.qualityFindings.map((finding) => (
                            <button type="button" key={finding.id} onClick={() => openRows(finding.rowIndices, finding.title)}><i className={finding.severity} /><span><strong>{finding.title}</strong><p>{finding.detail}</p></span><b>{finding.rowIndices.length > 0 ? `${finding.rowIndices.length} rows →` : "Review →"}</b></button>
                        ))}</div> : <div className="mda-analysis-no-charts"><strong>No material quality issues detected.</strong><p>The imported data is complete enough for the available analysis.</p></div>}
                    </InvestigationPanel>

                    <InvestigationPanel id="relationships" title="Relationships" description="Strong numeric relationships discovered in the dataset" count={viewModel.relationships.length} isOpen={openSections.has("relationships")} onToggle={toggleSection}>
                        {viewModel.relationships.length > 0 ? <div className="mda-analysis-relationship-list">{viewModel.relationships.map((relationship) => (
                            <button type="button" key={relationship.id} onClick={() => openRows(uniqueRows(relationship), relationship.title)}><span><strong>{relationship.title}</strong><small>{relationship.subtitle}</small></span><b>Inspect records →</b></button>
                        ))}</div> : <div className="mda-analysis-no-charts"><strong>No strong relationships were selected.</strong><p>The ranking engine did not find a numeric relationship valuable enough to present.</p></div>}
                    </InvestigationPanel>

                    <InvestigationPanel id="statistics" title="Statistics" description="Totals, averages, medians, minimums, and maximums" count={viewModel.statistics.length} isOpen={openSections.has("statistics")} onToggle={toggleSection}>
                        {viewModel.statistics.length > 0 ? <div className="mda-analysis-statistics-wrap"><table><thead><tr><th>Metric</th><th>Total</th><th>Average</th><th>Median</th><th>Minimum</th><th>Maximum</th></tr></thead><tbody>{viewModel.statistics.map((metric) => (
                            <tr key={metric.columnId}><th>{metric.columnName}</th><td>{formatCompactNumber(metric.total)}</td><td>{formatCompactNumber(metric.average)}</td><td>{formatCompactNumber(metric.median)}</td><td>{formatCompactNumber(metric.minimum)}</td><td>{formatCompactNumber(metric.maximum)}</td></tr>
                        ))}</tbody></table></div> : <div className="mda-analysis-no-charts"><strong>No numeric statistics are available.</strong><p>This dataset does not contain a numeric column suitable for summary statistics.</p></div>}
                    </InvestigationPanel>

                    <InvestigationPanel id="underlying-data" title="Underlying Data" description="Trace every conclusion back to the imported records" count={viewModel.dataset.rows.length} isOpen={openSections.has("underlying-data")} onToggle={toggleSection}>
                        <DataTable dataset={viewModel.dataset} limit={100} />
                    </InvestigationPanel>
                </div>
            </section>

            <DrillDown selection={drillDown} analysis={analysis} onClose={() => setDrillDown(null)} />
        </section>
    );
}

export default Analytics;

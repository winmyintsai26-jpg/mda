import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUpload } from "../context/UploadContext";
import { useDatabaseConnection } from "../context/DatabaseConnectionContext";
import { normalizeHeader } from "../utils/headerNormalizer";
import { COLUMN_NAMES_MUST_MATCH_MESSAGE } from "../utils/importValidationMessage";

const STATUS_LABELS = {
    ready: "Ready",
    warning: "Warning",
    action: "Action Required"
};

const READINESS_TITLES = {
    ready: "Ready to Import",
    warning: "Ready with Warnings",
    action: "Action Required"
};

function PlanStatusCard({ title, tone, summary, children }) {
    return (
        <details className={`import-review-card is-${tone}`}>
            <summary>
                <span className="import-review-status" aria-hidden="true" />
                <span className="import-review-copy">
                    <strong>{title}</strong>
                    <small>{summary}</small>
                </span>
                <span className="import-review-label">{STATUS_LABELS[tone]}</span>
                <span className="import-review-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="import-review-details">{children}</div>
        </details>
    );
}

function Import() {
    const navigate = useNavigate();
    const { table, fileName, selectedWorksheet, analysisTables, selectedTableIndex, setImportPlan, setImportCompletion } = useUpload();
    const { connectionName, requestBody, schema, selectedDatabase, selectedTable } = useDatabaseConnection();

    const selectedAnalysisTable = useMemo(() => {
        if (!selectedWorksheet || analysisTables.length === 0) {
            return null;
        }

        const worksheetTables = analysisTables.filter((candidate) => candidate.worksheetName === selectedWorksheet);
        if (worksheetTables.length === 0) {
            return null;
        }

        if (selectedTableIndex == null) {
            return worksheetTables[0];
        }

        return worksheetTables[selectedTableIndex] || worksheetTables[0];
    }, [analysisTables, selectedTableIndex, selectedWorksheet]);

    const previewHeaders = useMemo(() => table?.headers?.map((header) => header.name?.trim() || "") || [], [table]);
    const detectedTableCount = selectedWorksheet
        ? analysisTables.filter((candidate) => candidate.worksheetName === selectedWorksheet).length
        : analysisTables.length;
    const validationIssues = selectedAnalysisTable?.validation?.issues || [];
    const validationWarnings = selectedAnalysisTable?.validation?.warnings || [];
    const validationIssueCount = validationIssues.length + validationWarnings.length;

    const previewHeaderCollisions = useMemo(() => {
        const groups = new Map();

        previewHeaders.forEach((header, index) => {
            if (!header) {
                return;
            }

            const normalized = normalizeHeader(header);
            if (!normalized) {
                return;
            }

            if (!groups.has(normalized)) {
                groups.set(normalized, []);
            }

            groups.get(normalized).push({ header, index: index + 1 });
        });

        return [...groups.entries()]
            .filter(([, entries]) => entries.length > 1)
            .map(([normalized, entries]) => ({
                normalized,
                entries
            }));
    }, [previewHeaders]);

    const comparison = useMemo(() => {
        // Compare normalized header keys so spacing/punctuation/case differences
        // still map preview columns to the correct destination schema columns.
        const previewByName = new Map();
        previewHeaders.forEach((header) => {
            const key = normalizeHeader(header);
            if (header && !previewByName.has(key)) {
                previewByName.set(key, header);
            }
        });

        const schemaByName = new Map();
        schema.forEach((column) => {
            const key = normalizeHeader(column.columnName);
            if (key && !schemaByName.has(key)) {
                schemaByName.set(key, column);
            }
        });

        const ready = schema
            .filter((column) => previewByName.has(normalizeHeader(column.columnName)))
            .map((column) => ({
                previewColumn: previewByName.get(normalizeHeader(column.columnName)),
                databaseColumn: column.columnName,
                dataType: column.dataType,
                status: "Ready"
            }));

        const missing = schema
            .filter((column) => !previewByName.has(normalizeHeader(column.columnName)))
            .map((column) => ({
                previewColumn: null,
                databaseColumn: column.columnName,
                dataType: column.dataType,
                status: "Missing"
            }));

        const extra = previewHeaders
            .filter((header) => header && !schemaByName.has(normalizeHeader(header)))
            .map((header) => ({
                previewColumn: header,
                databaseColumn: null,
                dataType: null,
                status: "Extra"
            }));

        return {
            ready,
            missing,
            extra,
            matchedColumns: ready.map((item) => item.databaseColumn)
        };
    }, [previewHeaders, schema]);

    const reviewState = useMemo(() => {
        const destinationReady = Boolean(selectedDatabase && selectedTable && schema.length > 0);
        const hasHeaderConflicts = previewHeaderCollisions.length > 0;
        const hasMappedColumns = comparison.matchedColumns.length > 0;
        const hasBlockingIssue = destinationReady && (hasHeaderConflicts || !hasMappedColumns);
        const hasWarning = destinationReady && (
            selectedAnalysisTable?.validation?.isValid === false
            || comparison.missing.length > 0
            || comparison.extra.length > 0
        );
        const tone = !destinationReady || hasBlockingIssue ? "action" : hasWarning ? "warning" : "ready";

        return {
            destinationReady,
            hasBlockingIssue,
            tone
        };
    }, [comparison, previewHeaderCollisions.length, schema.length, selectedAnalysisTable?.validation?.isValid, selectedDatabase, selectedTable]);

    const readinessMessage = useMemo(() => {
        if (!reviewState.destinationReady) return "Select a destination on Connections before importing.";
        if (previewHeaderCollisions.length > 0) {
            return `${previewHeaderCollisions.length} column name conflict${previewHeaderCollisions.length === 1 ? "" : "s"} must be resolved.`;
        }
        if (comparison.matchedColumns.length === 0) return COLUMN_NAMES_MUST_MATCH_MESSAGE;
        if (reviewState.tone === "warning") {
            const warnings = [];
            if (validationIssueCount > 0) warnings.push(`${validationIssueCount} validation item${validationIssueCount === 1 ? " requires" : "s require"} review`);
            if (comparison.missing.length > 0) warnings.push(`${comparison.missing.length} destination column${comparison.missing.length === 1 ? " is" : "s are"} not mapped`);
            if (comparison.extra.length > 0) warnings.push(`${comparison.extra.length} source column${comparison.extra.length === 1 ? " will" : "s will"} not be imported`);
            return `${warnings.join(". ")}.`;
        }
        return "No blocking issues detected.";
    }, [comparison.extra.length, comparison.matchedColumns.length, comparison.missing.length, previewHeaderCollisions.length, reviewState.destinationReady, reviewState.tone, validationIssueCount]);

    const handleImport = () => {
        if (!table || !selectedDatabase || !selectedTable) {
            return;
        }

        setImportCompletion(null);
        setImportPlan({
            id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
            connection: requestBody,
            database: selectedDatabase,
            table: selectedTable,
            schema,
            comparison,
            source: {
                name: table?.title || selectedAnalysisTable?.title || selectedTable || "Imported dataset",
                fileName,
                worksheet: selectedWorksheet || "",
                headers: table.headers.map((header) => header.name ?? ""),
                rows: table.rows.map((row) => row.map((value) => String(value ?? "")))
            }
        });
        navigate("/import");
    };

    if (!table || !Array.isArray(table.headers) || table.headers.length === 0) {
        return (
            <div className="import-page">
                <div className="import-shell empty">
                    <h1>No Preview Table Available</h1>
                    <p>Return to Preview and finish reviewing a table before importing.</p>
                    <div className="import-actions-row">
                        <button type="button" className="secondary" onClick={() => navigate("/preview")}>
                            Back to Preview
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="import-page">
            <div className="import-shell">
                <div className="import-header">
                    <div>
                        <p className="dashboard-eyebrow">Smart Import Plan</p>
                        <h1>Final review before import.</h1>
                        <p>Confirm that the workbook is safe to import and verify where the data will go.</p>
                    </div>
                </div>

                <section className={`import-executive-summary is-${reviewState.tone}`} aria-labelledby="import-review-heading">
                    <div className="import-executive-heading">
                        <div>
                            <span>Import readiness</span>
                            <h2 id="import-review-heading"><i className="import-readiness-symbol" aria-hidden="true">{reviewState.tone === "ready" ? "✓" : reviewState.tone === "warning" ? "⚠" : "✕"}</i>{READINESS_TITLES[reviewState.tone]}</h2>
                            <p>{readinessMessage}</p>
                        </div>
                        <span className={`import-overall-status is-${reviewState.tone}`}>
                            <i aria-hidden="true" /> {STATUS_LABELS[reviewState.tone]}
                        </span>
                    </div>
                    <div className={`import-destination-summary ${reviewState.destinationReady ? "is-selected" : "is-missing"}`}>
                        <span>Destination</span>
                        <strong>{reviewState.destinationReady ? <>{connectionName || "Database Connection"}<i aria-hidden="true">→</i>{selectedTable}</> : "No destination selected"}</strong>
                    </div>
                </section>

                <div className="import-review-grid" aria-label="Import plan review">
                    <PlanStatusCard
                        title="Structure"
                        tone="ready"
                        summary={`${detectedTableCount || 1} table${detectedTableCount === 1 ? "" : "s"} detected.`}
                    >
                        <dl className="import-review-data-list">
                            <div><dt>Workbook</dt><dd>{fileName || "Current workbook"}</dd></div>
                            <div><dt>Worksheet</dt><dd>{selectedWorksheet || "Current worksheet"}</dd></div>
                            <div><dt>Table</dt><dd>{table?.title || selectedAnalysisTable?.title || "Edited preview table"}</dd></div>
                            {table.savedLayout?.name && <div><dt>Applied layout</dt><dd>{table.savedLayout.name}</dd></div>}
                        </dl>
                    </PlanStatusCard>

                    <PlanStatusCard
                        title="Column Mapping"
                        tone={!reviewState.destinationReady || comparison.ready.length === 0 ? "action" : comparison.missing.length > 0 || comparison.extra.length > 0 ? "warning" : "ready"}
                        summary={!reviewState.destinationReady
                            ? "Destination required to review mappings."
                            : comparison.ready.length === 0
                                ? "Column names must be matched."
                                : comparison.missing.length > 0
                                    ? `${comparison.missing.length} destination column${comparison.missing.length === 1 ? " requires" : "s require"} mapping.`
                                    : comparison.extra.length > 0
                                        ? `${comparison.extra.length} source column${comparison.extra.length === 1 ? " will" : "s will"} not be imported.`
                                        : `All ${comparison.ready.length} columns are mapped.`}
                    >
                        <div className="comparison-grid">
                            <div className="comparison-block ready">
                                <h3>Matched</h3>
                                {comparison.ready.length > 0 ? comparison.ready.map((item) => (
                                    <div key={`ready-${item.databaseColumn}`} className="comparison-row"><strong>{item.previewColumn}</strong><span>{item.databaseColumn} · {item.dataType}</span></div>
                                )) : <p>No matching columns yet.</p>}
                            </div>
                            <div className="comparison-block missing">
                                <h3>Missing</h3>
                                {comparison.missing.length > 0 ? comparison.missing.map((item) => (
                                    <div key={`missing-${item.databaseColumn}`} className="comparison-row"><strong>{item.databaseColumn}</strong><span>Not found in the reviewed workbook</span></div>
                                )) : <p>No missing destination columns.</p>}
                            </div>
                            <div className="comparison-block extra">
                                <h3>Not imported</h3>
                                {comparison.extra.length > 0 ? comparison.extra.map((item) => (
                                    <div key={`extra-${item.previewColumn}`} className="comparison-row"><strong>{item.previewColumn}</strong><span>Not present in the destination</span></div>
                                )) : <p>Every source column has a destination.</p>}
                            </div>
                        </div>
                    </PlanStatusCard>

                    <PlanStatusCard
                        title="Transformations"
                        tone={!reviewState.destinationReady ? "action" : comparison.extra.length > 0 ? "warning" : "ready"}
                        summary={!reviewState.destinationReady
                            ? "Destination required to confirm transformations."
                            : comparison.extra.length > 0
                                ? `Conversions will be applied; ${comparison.extra.length} column${comparison.extra.length === 1 ? " is" : "s are"} excluded.`
                                : "Numeric and date conversions will be applied."}
                    >
                        <div className="import-plan-list">
                            <p><strong>Value formatting</strong><span>Numbers, dates, true/false values, and empty cells will use the existing import rules.</span></p>
                            <p><strong>Column handling</strong><span>{comparison.extra.length} source column{comparison.extra.length === 1 ? "" : "s"} without a destination match will not be imported.</span></p>
                        </div>
                    </PlanStatusCard>

                    <PlanStatusCard
                        title="Validation"
                        tone={!reviewState.destinationReady || previewHeaderCollisions.length > 0 ? "action" : selectedAnalysisTable?.validation?.isValid === false || comparison.missing.length > 0 ? "warning" : "ready"}
                        summary={!reviewState.destinationReady
                            ? "Destination required to complete validation."
                            : previewHeaderCollisions.length > 0
                                ? `${previewHeaderCollisions.length} column name conflict${previewHeaderCollisions.length === 1 ? "" : "s"} detected.`
                                : selectedAnalysisTable?.validation?.isValid === false
                                    ? validationIssueCount > 0
                                        ? `${validationIssueCount} validation item${validationIssueCount === 1 ? " requires" : "s require"} review.`
                                        : "Validation issues require review."
                                    : comparison.missing.length > 0
                                        ? `${comparison.missing.length} unmapped column${comparison.missing.length === 1 ? " requires" : "s require"} review.`
                                        : "No validation issues detected."}
                    >
                        <div className="import-plan-status-grid">
                            <div><span>Table review</span><strong>{selectedAnalysisTable?.validation?.isValid ? "Ready" : "Review"}</strong></div>
                            <div><span>Mapped columns</span><strong>{comparison.ready.length}</strong></div>
                            <div><span>Missing columns</span><strong>{comparison.missing.length}</strong></div>
                            <div><span>Column conflicts</span><strong>{previewHeaderCollisions.length}</strong></div>
                        </div>
                        {previewHeaderCollisions.length > 0 && <p className="import-message error">{COLUMN_NAMES_MUST_MATCH_MESSAGE}</p>}
                        {validationIssues.map((issue) => <p className="import-help-text" key={`issue-${issue}`}>{issue}</p>)}
                        {validationWarnings.map((warning) => <p className="import-help-text" key={`warning-${warning}`}>{warning}</p>)}
                        <p className="import-help-text">Destination requirements and value checks will run when the import begins.</p>
                    </PlanStatusCard>

                    <PlanStatusCard
                        title="Duplicate Detection"
                        tone={reviewState.destinationReady ? "ready" : "action"}
                        summary={reviewState.destinationReady
                            ? "No duplicate conflicts detected."
                            : "Destination required to confirm duplicate handling."}
                    >
                        <p className="import-help-text">MDA will follow the duplicate rules already defined for the selected destination table.</p>
                    </PlanStatusCard>

                    <PlanStatusCard
                        title="Destination"
                        tone={reviewState.destinationReady ? "ready" : "action"}
                        summary={reviewState.destinationReady
                            ? `${connectionName || "Database Connection"} → ${selectedTable}`
                            : "No destination selected."}
                    >
                        <div className="import-destination-detail">
                            <p>{reviewState.destinationReady ? "This reusable destination is managed on the Connections page." : "Configure and select the reusable destination on the Connections page."}</p>
                            <button type="button" className="secondary" onClick={() => navigate("/connections")}>Manage Connections</button>
                        </div>
                    </PlanStatusCard>
                </div>

                <div className={`import-plan-action-card is-${reviewState.tone}`}>
                    <div>
                        <span>Final decision</span>
                        <h2>{READINESS_TITLES[reviewState.tone]}</h2>
                        <p>{reviewState.destinationReady
                            ? `${table.rows.length.toLocaleString("en-US")} reviewed rows will be sent to ${connectionName || "Database Connection"} → ${selectedTable}.`
                            : "Select a destination on Connections to complete this review."}</p>
                    </div>
                    <div className="import-actions-row">
                        <button
                            type="button"
                            className="primary import-execute-button"
                            onClick={handleImport}
                            disabled={!reviewState.destinationReady || comparison.matchedColumns.length === 0 || previewHeaderCollisions.length > 0}
                        >
                            <span className="button-content"><span>Execute Import</span></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Import;

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpload } from "../context/UploadContext";
import { normalizeHeader } from "../utils/headerNormalizer";
import { COLUMN_NAMES_MUST_MATCH_MESSAGE } from "../utils/importValidationMessage";
import { API_BASE_URL } from "../config/api";

const STATUS_LABELS = {
    ready: "Ready",
    warning: "Warnings",
    action: "Action Required"
};

function estimateImportTime(rowCount) {
    if (rowCount < 1000) return "Less than 1 minute";
    if (rowCount < 10000) return "About 1 minute";
    return `About ${Math.max(2, Math.ceil(rowCount / 10000))} minutes`;
}

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

    const [connection, setConnection] = useState({
        host: "localhost",
        port: "3306",
        username: "",
        password: ""
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState("");
    const [connectionError, setConnectionError] = useState("");
    const [databases, setDatabases] = useState([]);
    const [tables, setTables] = useState([]);
    const [schema, setSchema] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState("");
    const [selectedTable, setSelectedTable] = useState("");

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
    const previewRowCount = Array.isArray(table?.rows) ? table.rows.length : 0;

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
            tone,
            rowsReady: destinationReady ? (hasBlockingIssue ? 0 : previewRowCount) : null,
            rowsRequiringAttention: destinationReady ? (hasBlockingIssue ? previewRowCount : 0) : null
        };
    }, [comparison, previewHeaderCollisions.length, previewRowCount, schema.length, selectedAnalysisTable?.validation?.isValid, selectedDatabase, selectedTable]);

    const handleConnectionFieldChange = (field) => (event) => {
        setConnection((current) => ({
            ...current,
            [field]: event.target.value
        }));
    };

    const requestBody = useMemo(() => ({
        host: connection.host,
        port: Number(connection.port || 3306),
        username: connection.username,
        password: connection.password
    }), [connection.host, connection.password, connection.port, connection.username]);

    const handleConnect = async () => {
        if (isConnecting) {
            return;
        }

        setIsConnecting(true);
        setConnectionError("");
        setConnectionMessage("");
        setSelectedDatabase("");
        setSelectedTable("");
        setTables([]);
        setSchema([]);

        try {
            const connectionResponse = await fetch(`${API_BASE_URL}/database/mysql/test-connection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            const connectionPayload = await connectionResponse.json();
            if (!connectionResponse.ok) {
                throw new Error(connectionPayload.message || connectionPayload.Message || "Unable to connect to MySQL.");
            }

            const databasesResponse = await fetch(`${API_BASE_URL}/database/mysql/databases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });
            const databasesPayload = await databasesResponse.json();
            if (!databasesResponse.ok) {
                throw new Error(databasesPayload.message || "Unable to load databases.");
            }

            setDatabases(databasesPayload);
            setConnectionMessage(connectionPayload.message || connectionPayload.Message || "Connection successful.");
        } catch (error) {
            setConnectionError(error.message || "Unable to connect to MySQL.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDatabaseChange = async (event) => {
        const database = event.target.value;
        setSelectedDatabase(database);
        setSelectedTable("");
        setTables([]);
        setSchema([]);
        setConnectionError("");

        if (!database) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/database/mysql/tables`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...requestBody,
                    database
                })
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.message || "Unable to load tables.");
            }

            setTables(payload);
        } catch (error) {
            setConnectionError(error.message || "Unable to load tables.");
        }
    };

    const handleTableChange = async (event) => {
        const nextTable = event.target.value;
        setSelectedTable(nextTable);
        setSchema([]);
        setConnectionError("");

        if (!nextTable || !selectedDatabase) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/database/mysql/schema`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...requestBody,
                    database: selectedDatabase,
                    table: nextTable
                })
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.message || "Unable to load schema.");
            }

            setSchema(payload);
        } catch (error) {
            setConnectionError(error.message || "Unable to load schema.");
        }
    };

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
                        <h1>Review what MDA will do.</h1>
                        <p>Confirm the source structure, destination, mappings, and validation status before any data is imported.</p>
                    </div>
                </div>

                <section className={`import-executive-summary is-${reviewState.tone}`} aria-labelledby="import-review-heading">
                    <div className="import-executive-heading">
                        <div>
                            <span>Import review</span>
                            <h2 id="import-review-heading">Is this import ready?</h2>
                        </div>
                        <span className={`import-overall-status is-${reviewState.tone}`}>
                            <i aria-hidden="true" /> {STATUS_LABELS[reviewState.tone]}
                        </span>
                    </div>
                    <div className="import-executive-grid">
                        <div className="is-wide"><span>Workbook</span><strong>{fileName || "Current workbook"}</strong></div>
                        <div className="is-wide"><span>Destination table</span><strong>{reviewState.destinationReady ? `${selectedDatabase}.${selectedTable}` : "Not selected"}</strong></div>
                        <div><span>Rows ready to import</span><strong>{reviewState.rowsReady == null ? "Pending" : reviewState.rowsReady.toLocaleString("en-US")}</strong></div>
                        <div><span>Rows requiring attention</span><strong>{reviewState.rowsRequiringAttention == null ? "Pending" : reviewState.rowsRequiringAttention.toLocaleString("en-US")}</strong></div>
                        <div><span>Estimated import time</span><strong>{reviewState.destinationReady ? estimateImportTime(table.rows.length) : "Pending"}</strong></div>
                        <div><span>Overall status</span><strong>{STATUS_LABELS[reviewState.tone]}</strong></div>
                    </div>
                </section>

                <div className="import-review-grid" aria-label="Import plan review">
                    <PlanStatusCard
                        title="Structure"
                        tone="ready"
                        summary={`${selectedWorksheet || "Current worksheet"} · ${table.rows.length.toLocaleString("en-US")} rows · ${table.headers.length} columns`}
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
                            ? "Choose a destination to review column matches."
                            : `${comparison.ready.length} matched · ${comparison.missing.length} missing · ${comparison.extra.length} not imported`}
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
                            ? "Transformation review is available after destination selection."
                            : comparison.extra.length > 0
                                ? `Values will be standardized; ${comparison.extra.length} source column${comparison.extra.length === 1 ? "" : "s"} will not be imported.`
                                : "Values will be standardized for the destination."}
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
                            ? "Choose a destination to complete validation."
                            : previewHeaderCollisions.length > 0
                                ? "Column names need attention before import."
                                : selectedAnalysisTable?.validation?.isValid === false || comparison.missing.length > 0
                                    ? "Review the warnings before importing."
                                    : "The reviewed data is ready for destination checks."}
                    >
                        <div className="import-plan-status-grid">
                            <div><span>Table review</span><strong>{selectedAnalysisTable?.validation?.isValid ? "Ready" : "Review"}</strong></div>
                            <div><span>Mapped columns</span><strong>{comparison.ready.length}</strong></div>
                            <div><span>Missing columns</span><strong>{comparison.missing.length}</strong></div>
                            <div><span>Column conflicts</span><strong>{previewHeaderCollisions.length}</strong></div>
                        </div>
                        {previewHeaderCollisions.length > 0 && <p className="import-message error">{COLUMN_NAMES_MUST_MATCH_MESSAGE}</p>}
                        <p className="import-help-text">Destination requirements and value checks will run when the import begins.</p>
                    </PlanStatusCard>

                    <PlanStatusCard
                        title="Duplicate Detection"
                        tone={reviewState.destinationReady ? "ready" : "action"}
                        summary={reviewState.destinationReady
                            ? "The destination table’s existing duplicate rules will be used."
                            : "Choose a destination to confirm duplicate handling."}
                    >
                        <p className="import-help-text">MDA will follow the duplicate rules already defined for the selected destination table.</p>
                    </PlanStatusCard>

                    <PlanStatusCard
                        title="Destination"
                        tone={reviewState.destinationReady ? "ready" : "action"}
                        summary={reviewState.destinationReady
                            ? `${selectedDatabase}.${selectedTable} is selected for this import.`
                            : "Connect to MySQL and choose the destination table."}
                    >
                        <div className="import-form-grid">
                            <label><span>Host</span><input value={connection.host} onChange={handleConnectionFieldChange("host")} /></label>
                            <label><span>Username</span><input value={connection.username} onChange={handleConnectionFieldChange("username")} /></label>
                            <label><span>Password</span><input type="password" value={connection.password} onChange={handleConnectionFieldChange("password")} /></label>
                            <label><span>Port</span><input value={connection.port} onChange={handleConnectionFieldChange("port")} /></label>
                        </div>
                        <div className="import-actions-row import-connect-actions-row">
                            <button type="button" className="secondary" onClick={handleConnect} disabled={isConnecting}>
                                <span className="button-content">{isConnecting && <span className="button-spinner" aria-hidden="true" />}<span>{isConnecting ? "Connecting..." : "Connect to MySQL"}</span></span>
                            </button>
                            {connectionMessage && <p className="import-message success">{connectionMessage}</p>}
                            {connectionError && <p className="import-message error">{connectionError}</p>}
                        </div>

                        {databases.length > 0 && (
                            <div className="import-form-grid single-row import-destination-selection">
                                <label><span>Database</span><select value={selectedDatabase} onChange={handleDatabaseChange}><option value="">Select database</option>{databases.map((database) => <option key={database} value={database}>{database}</option>)}</select></label>
                                <label><span>Table</span><select value={selectedTable} onChange={handleTableChange} disabled={!selectedDatabase}><option value="">Select table</option>{tables.map((tableName) => <option key={tableName} value={tableName}>{tableName}</option>)}</select></label>
                            </div>
                        )}
                        {schema.length > 0 && (
                            <div className="schema-table-wrap import-destination-schema">
                                <table className="schema-table"><thead><tr><th>Column</th><th>Type</th><th>Nullable</th><th>Default</th><th>Auto Increment</th></tr></thead><tbody>{schema.map((column) => <tr key={column.columnName}><td>{column.columnName}</td><td>{column.dataType}</td><td>{column.nullable ? "Yes" : "No"}</td><td>{column.defaultValue ?? "-"}</td><td>{column.autoIncrement ? "Yes" : "No"}</td></tr>)}</tbody></table>
                            </div>
                        )}
                    </PlanStatusCard>
                </div>

                <div className={`import-plan-action-card is-${reviewState.tone}`}>
                    <div>
                        <span>Final decision</span>
                        <h2>{reviewState.tone === "action" ? "Complete the required items." : reviewState.tone === "warning" ? "Review warnings, then import." : "Ready to import."}</h2>
                        <p>{reviewState.destinationReady
                            ? `${table.rows.length.toLocaleString("en-US")} reviewed rows will be sent to ${selectedDatabase}.${selectedTable}.`
                            : "Choose a destination table to complete this review."}</p>
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

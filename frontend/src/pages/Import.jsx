import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUpload } from "../context/UploadContext";
import { normalizeHeader } from "../utils/headerNormalizer";
import { API_BASE_URL } from "../config/api";
import RememberLayoutDialog from "../saved-layouts/components/RememberLayoutDialog";
import { createSavedLayout } from "../saved-layouts/models/savedLayout";
import { savedLayoutService } from "../saved-layouts/services/savedLayoutService";

function Import() {
    const navigate = useNavigate();
    const { table, fileName, selectedWorksheet, analysisTables, selectedTableIndex, setImportedDataset } = useUpload();

    const [connection, setConnection] = useState({
        host: "localhost",
        port: "3306",
        username: "",
        password: ""
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState("");
    const [connectionError, setConnectionError] = useState("");
    const [databases, setDatabases] = useState([]);
    const [tables, setTables] = useState([]);
    const [schema, setSchema] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState("");
    const [selectedTable, setSelectedTable] = useState("");
    const [importResult, setImportResult] = useState(null);
    const [layoutDialogStep, setLayoutDialogStep] = useState(null);
    const [layoutName, setLayoutName] = useState("");
    const [layoutError, setLayoutError] = useState("");
    const [layoutSaveMessage, setLayoutSaveMessage] = useState("");

    const importSuccessMessage = useMemo(() => {
        if (!importResult) {
            return "";
        }

        const parts = ["Import Successful!"];

        if (typeof importResult.insertedRowCount === "number") {
            parts.push(`${importResult.insertedRowCount} row${importResult.insertedRowCount === 1 ? "" : "s"} imported.`);
        }

        if (importResult.message) {
            parts.push(importResult.message);
        }

        return `✅ ${parts.join(" ")}`;
    }, [importResult]);

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

    const handleCloseLayoutDialog = useCallback(() => {
        setLayoutDialogStep(null);
        setLayoutError("");
    }, []);

    const handleRememberLayout = () => {
        const suggestedName = table?.title || selectedAnalysisTable?.title || fileName.replace(/\.[^.]+$/, "");
        setLayoutName(suggestedName || "");
        setLayoutError("");
        setLayoutDialogStep("name");
    };

    const handleSaveLayout = (event) => {
        event.preventDefault();
        const trimmedName = layoutName.trim();

        if (!trimmedName) {
            setLayoutError("Layout name is required.");
            return;
        }

        try {
            const savedLayout = createSavedLayout({
                name: trimmedName,
                fileName,
                analysisTables,
                table,
                selectedAnalysisTable,
                selectedWorksheet,
                columnMappings: comparison.ready,
                destination: {
                    provider: "mysql",
                    database: selectedDatabase,
                    table: selectedTable
                }
            });

            savedLayoutService.save(savedLayout);
            setLayoutSaveMessage(`Layout “${savedLayout.name}” was saved.`);
            setLayoutDialogStep(null);
            setLayoutError("");
        } catch (error) {
            setLayoutError(error.message || "Unable to save this layout.");
        }
    };

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

    const handleImport = async () => {
        if (isImporting || !table || !selectedDatabase || !selectedTable) {
            return;
        }

        setIsImporting(true);
        setConnectionError("");
        setImportResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/database/mysql/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...requestBody,
                    database: selectedDatabase,
                    table: selectedTable,
                    headers: table.headers.map((header) => header.name ?? ""),
                    rows: table.rows.map((row) => row.map((value) => String(value ?? "")))
                })
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.message || "Import failed.");
            }

            setImportResult(payload);
            setImportedDataset({
                name: table?.title || selectedAnalysisTable?.title || selectedTable || "Imported dataset",
                fileName,
                worksheet: selectedWorksheet || "",
                destination: { provider: "mysql", database: selectedDatabase, table: selectedTable },
                headers: table.headers.map((header, index) => ({
                    id: header.id ?? `column-${index}`,
                    name: header.name ?? `Column ${index + 1}`,
                    dataType: header.dataType ?? ""
                })),
                rows: table.rows.map((row) => row.map((value) => String(value ?? ""))),
                importedAt: new Date().toISOString(),
                insertedRowCount: payload.insertedRowCount
            });
            setLayoutDialogStep("success");
            setLayoutName("");
            setLayoutError("");
            setLayoutSaveMessage("");
        } catch (error) {
            setConnectionError(error.message || "Import failed.");
        } finally {
            setIsImporting(false);
        }
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
                        <h1>Import to MySQL</h1>
                        <p>Connect to MySQL, inspect the destination schema, and import the edited Preview data.</p>
                    </div>
                    <div className="import-actions-row">
                        <Link to="/preview" className="import-link-button secondary">Back to Preview</Link>
                    </div>
                </div>

                <div className="import-summary-card">
                    <h2>Preview Source</h2>
                    <div className="import-summary-grid">
                        <div><span>Workbook</span><strong>{fileName || "Current workbook"}</strong></div>
                        <div><span>Worksheet</span><strong>{selectedWorksheet || "Current worksheet"}</strong></div>
                        <div><span>Table</span><strong>{table?.title || selectedAnalysisTable?.title || "Edited preview table"}</strong></div>
                        <div><span>Rows</span><strong>{table.rows.length}</strong></div>
                        <div><span>Columns</span><strong>{table.headers.length}</strong></div>
                        {table.savedLayout?.name && (
                            <div><span>Applied Layout</span><strong>{table.savedLayout.name}</strong></div>
                        )}
                        {table.savedLayout?.importDestination && (
                            <div>
                                <span>Saved Destination</span>
                                <strong>{table.savedLayout.importDestination.database}.{table.savedLayout.importDestination.table}</strong>
                            </div>
                        )}
                    </div>
                </div>

                <div className="import-card">
                    <h2>Connect to MySQL</h2>
                    <div className="import-form-grid">
                        <label>
                            <span>Host</span>
                            <input value={connection.host} onChange={handleConnectionFieldChange("host")} />
                        </label>
                        <label>
                            <span>Port</span>
                            <input value={connection.port} onChange={handleConnectionFieldChange("port")} />
                        </label>
                        <label>
                            <span>Username</span>
                            <input value={connection.username} onChange={handleConnectionFieldChange("username")} />
                        </label>
                        <label>
                            <span>Password</span>
                            <input type="password" value={connection.password} onChange={handleConnectionFieldChange("password")} />
                        </label>
                    </div>
                    <div className="import-actions-row import-connect-actions-row">
                        <button type="button" className="primary" onClick={handleConnect} disabled={isConnecting}>
                            <span className="button-content">
                                {isConnecting && <span className="button-spinner" aria-hidden="true" />}
                                <span>{isConnecting ? "Connecting..." : "Connect"}</span>
                            </span>
                        </button>
                        {connectionMessage && <p className="import-message success">{connectionMessage}</p>}
                        {connectionError && <p className="import-message error">{connectionError}</p>}
                    </div>
                </div>

                {databases.length > 0 && (
                    <div className="import-card">
                        <h2>Select Destination</h2>
                        <div className="import-form-grid single-row">
                            <label>
                                <span>Database</span>
                                <select value={selectedDatabase} onChange={handleDatabaseChange}>
                                    <option value="">Select database</option>
                                    {databases.map((database) => (
                                        <option key={database} value={database}>{database}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span>Table</span>
                                <select value={selectedTable} onChange={handleTableChange} disabled={!selectedDatabase}>
                                    <option value="">Select table</option>
                                    {tables.map((tableName) => (
                                        <option key={tableName} value={tableName}>{tableName}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                )}

                {schema.length > 0 && (
                    <div className="import-card">
                        <h2>Destination Schema</h2>
                        <div className="schema-table-wrap">
                            <table className="schema-table">
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Type</th>
                                        <th>Nullable</th>
                                        <th>Default</th>
                                        <th>Auto Increment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schema.map((column) => (
                                        <tr key={column.columnName}>
                                            <td>{column.columnName}</td>
                                            <td>{column.dataType}</td>
                                            <td>{column.nullable ? "Yes" : "No"}</td>
                                            <td>{column.defaultValue ?? "-"}</td>
                                            <td>{column.autoIncrement ? "Yes" : "No"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {schema.length > 0 && (
                    <div className="import-card">
                        <h2>Column Comparison</h2>
                        <div className="comparison-grid">
                            <div className="comparison-block ready">
                                <h3>Ready</h3>
                                {comparison.ready.length > 0 ? comparison.ready.map((item) => (
                                    <div key={`ready-${item.databaseColumn}`} className="comparison-row">
                                        <strong>{item.previewColumn}</strong>
                                        <span>{item.databaseColumn} • {item.dataType}</span>
                                    </div>
                                )) : <p>No matching columns.</p>}
                            </div>
                            <div className="comparison-block missing">
                                <h3>Missing</h3>
                                {comparison.missing.length > 0 ? comparison.missing.map((item) => (
                                    <div key={`missing-${item.databaseColumn}`} className="comparison-row">
                                        <strong>{item.databaseColumn}</strong>
                                        <span>Database column not present in Preview</span>
                                    </div>
                                )) : <p>No missing database columns.</p>}
                            </div>
                            <div className="comparison-block extra">
                                <h3>Extra</h3>
                                {comparison.extra.length > 0 ? comparison.extra.map((item) => (
                                    <div key={`extra-${item.previewColumn}`} className="comparison-row">
                                        <strong>{item.previewColumn}</strong>
                                        <span>Ignored during import</span>
                                    </div>
                                )) : <p>No extra Preview columns.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {schema.length > 0 && (
                    <div className="import-card">
                        <h2>Import</h2>
                        <p className="import-help-text">Only columns that exist in both the edited Preview table and the selected MySQL table will be included in INSERT statements.</p>
                        {previewHeaderCollisions.length > 0 && (
                            <p className="import-message error">
                                Import is blocked because some Preview headers normalize to the same value. Resolve these collisions first: {previewHeaderCollisions
                                    .map((collision) => `${collision.normalized} (${collision.entries.map((entry) => `'${entry.header}' col ${entry.index}`).join(", ")})`)
                                    .join(" | ")}
                            </p>
                        )}
                        <div className="import-actions-row">
                            <button
                                type="button"
                                className="primary"
                                onClick={handleImport}
                                disabled={isImporting || comparison.matchedColumns.length === 0 || previewHeaderCollisions.length > 0}
                            >
                                <span className="button-content">
                                    {isImporting && <span className="button-spinner" aria-hidden="true" />}
                                    <span>{isImporting ? "Importing..." : "Import"}</span>
                                </span>
                            </button>
                            {importResult && (
                                <p className="import-message success">
                                    {importSuccessMessage}
                                    {selectedTable ? ` Destination table: ${selectedTable}.` : ""}
                                </p>
                            )}
                            {layoutSaveMessage && <p className="import-message success">{layoutSaveMessage}</p>}
                        </div>
                    </div>
                )}
            </div>

            {layoutDialogStep && (
                <RememberLayoutDialog
                    step={layoutDialogStep}
                    insertedRowCount={importResult?.insertedRowCount}
                    database={selectedDatabase}
                    table={selectedTable}
                    layoutName={layoutName}
                    error={layoutError}
                    onLayoutNameChange={(event) => {
                        setLayoutName(event.target.value);
                        setLayoutError("");
                    }}
                    onRemember={handleRememberLayout}
                    onAnalyze={() => navigate("/analytics")}
                    onNotNow={handleCloseLayoutDialog}
                    onSave={handleSaveLayout}
                />
            )}
        </div>
    );
}

export default Import;

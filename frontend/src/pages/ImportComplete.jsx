import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useUpload } from "../context/UploadContext";
import RememberLayoutDialog from "../saved-layouts/components/RememberLayoutDialog";
import { createSavedLayout } from "../saved-layouts/models/savedLayout";
import { savedLayoutService } from "../saved-layouts/services/savedLayoutService";
import { executeImportPlan } from "../services/importExecutionService";
import { simplifyImportError } from "../utils/importValidationMessage";
import { useWorkbooks } from "../workbooks/WorkbookContext";

function formatElapsed(milliseconds) {
    if (milliseconds < 1000) return `${milliseconds} ms`;
    return `${(milliseconds / 1000).toFixed(milliseconds < 10000 ? 1 : 0)} seconds`;
}

function ImportComplete() {
    const navigate = useNavigate();
    const { workbooks, saveWorkbook } = useWorkbooks();
    const {
        table,
        fileName,
        analysisTables,
        analysisResult,
        selectedTableIndex,
        selectedWorksheet,
        worksheetTables,
        activeWorkbookId,
        setActiveWorkbookId,
        importPlan,
        setImportPlan,
        importCompletion,
        setImportCompletion,
        setImportedDataset
    } = useUpload();
    const finalizedPlanRef = useRef(null);
    const [isExecuting, setIsExecuting] = useState(Boolean(importPlan && !importCompletion));
    const [executionError, setExecutionError] = useState("");
    const [showLayoutDialog, setShowLayoutDialog] = useState(false);
    const [layoutName, setLayoutName] = useState("");
    const [layoutError, setLayoutError] = useState("");
    const [layoutSaveMessage, setLayoutSaveMessage] = useState("");

    const selectedAnalysisTable = useMemo(() => {
        const worksheetMatches = analysisTables.filter((candidate) => candidate.worksheetName === selectedWorksheet);
        return worksheetMatches[selectedTableIndex ?? 0] || worksheetMatches[0] || null;
    }, [analysisTables, selectedTableIndex, selectedWorksheet]);

    useEffect(() => {
        if (!importPlan || importCompletion) return;

        let active = true;
        executeImportPlan(importPlan)
            .then(({ payload, elapsedMs }) => {
                if (!active || finalizedPlanRef.current === importPlan.id) return;
                finalizedPlanRef.current = importPlan.id;

                const importedDataset = {
                    name: importPlan.source.name,
                    fileName: importPlan.source.fileName,
                    worksheet: importPlan.source.worksheet,
                    destination: { provider: "mysql", database: importPlan.database, table: importPlan.table },
                    headers: table.headers.map((header, index) => ({
                        id: header.id ?? `column-${index}`,
                        name: header.name ?? `Column ${index + 1}`,
                        dataType: header.dataType ?? ""
                    })),
                    rows: importPlan.source.rows,
                    importedAt: new Date().toISOString(),
                    insertedRowCount: payload.insertedRowCount
                };
                const completion = {
                    rowsImported: payload.insertedRowCount ?? importPlan.source.rows.length,
                    rowsRejected: payload.rejectedRowCount ?? 0,
                    elapsedMs,
                    destination: `${importPlan.database}.${importPlan.table}`,
                    message: payload.message || "Import completed successfully."
                };

                setImportedDataset(importedDataset);
                setImportCompletion(completion);
                if (activeWorkbookId) {
                    const current = workbooks.find((item) => item.id === activeWorkbookId);
                    if (current) {
                        const saved = saveWorkbook({
                            ...current,
                            status: "Imported",
                            workflowStep: 5,
                            analysisStatus: "Ready",
                            destination: importedDataset.destination,
                            lastActivity: `Import completed with ${completion.rowsImported.toLocaleString("en-US")} rows`,
                            snapshot: {
                                ...current.snapshot,
                                fileName,
                                analysisResult,
                                analysisTables,
                                selectedTableIndex,
                                selectedWorksheet,
                                worksheetTables,
                                table,
                                importedDataset
                            }
                        });
                        setActiveWorkbookId(saved.id);
                    }
                }
                setIsExecuting(false);
            })
            .catch((error) => {
                if (!active) return;
                setExecutionError(simplifyImportError(error.message));
                setIsExecuting(false);
            });

        return () => { active = false; };
    }, [activeWorkbookId, analysisResult, analysisTables, fileName, importCompletion, importPlan, saveWorkbook, selectedTableIndex, selectedWorksheet, setActiveWorkbookId, setImportCompletion, setImportedDataset, table, workbooks, worksheetTables]);

    if (!importPlan) {
        return <Navigate replace to={table?.headers?.length ? "/import-plan" : "/preview"} />;
    }

    const retryImport = () => {
        setIsExecuting(true);
        setExecutionError("");
        setImportCompletion(null);
        setImportPlan({ ...importPlan, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}` });
    };

    const beginSaveLayout = () => {
        setLayoutName(table?.title || selectedAnalysisTable?.title || fileName.replace(/\.[^.]+$/, "") || "");
        setLayoutError("");
        setShowLayoutDialog(true);
    };

    const saveLayout = (event) => {
        event.preventDefault();
        const name = layoutName.trim();
        if (!name) {
            setLayoutError("Layout name is required.");
            return;
        }

        try {
            const savedLayout = createSavedLayout({
                name,
                fileName,
                analysisTables,
                table,
                selectedAnalysisTable,
                selectedWorksheet,
                columnMappings: importPlan.comparison.ready,
                destination: {
                    provider: "mysql",
                    database: importPlan.database,
                    table: importPlan.table
                }
            });
            savedLayoutService.save(savedLayout);
            setLayoutSaveMessage(`Layout “${savedLayout.name}” was saved.`);
            setShowLayoutDialog(false);
        } catch (error) {
            setLayoutError(error.message || "Unable to save this layout.");
        }
    };

    if (isExecuting) {
        return <section className="import-page import-complete-page"><div className="import-shell"><article className="import-complete-card"><span className="button-spinner import-execution-spinner" aria-hidden="true" /><p className="dashboard-eyebrow">Import in progress</p><h1>Importing your reviewed data.</h1><p>MDA is executing the approved Smart Import Plan. Keep this page open until the import completes.</p></article></div></section>;
    }

    if (executionError || !importCompletion) {
        return <section className="import-page import-complete-page"><div className="import-shell"><article className="import-complete-card"><span className="import-complete-icon is-error" aria-hidden="true">!</span><p className="dashboard-eyebrow">Import needs attention</p><h1>The import could not be completed.</h1><p className="import-message error">{executionError || "Import failed."}</p><div className="import-complete-actions"><button type="button" className="primary" onClick={retryImport}>Retry Import</button><button type="button" className="secondary" onClick={() => navigate("/import-plan")}>Review Import Plan</button></div></article></div></section>;
    }

    return (
        <section className="import-page import-complete-page">
            <div className="import-shell">
                <article className="import-complete-card">
                    <span className="import-complete-icon" aria-hidden="true">✓</span>
                    <p className="dashboard-eyebrow">Import Complete</p>
                    <h1>Your data is ready.</h1>
                    <p>The import finished successfully. Review the result or continue to Business Analysis.</p>

                    <div className="import-complete-grid">
                        <div><span>Rows imported</span><strong>{importCompletion.rowsImported.toLocaleString("en-US")}</strong></div>
                        <div><span>Rows rejected</span><strong>{importCompletion.rowsRejected.toLocaleString("en-US")}</strong></div>
                        <div><span>Destination</span><strong>{importCompletion.destination}</strong></div>
                        <div><span>Import duration</span><strong>{formatElapsed(importCompletion.elapsedMs)}</strong></div>
                    </div>

                    <div className="import-complete-actions">
                        <button type="button" className="primary" onClick={() => navigate("/analytics")}>View Business Analysis <span>→</span></button>
                        <button type="button" className="secondary" onClick={() => navigate("/workbooks")}>Return to Workbooks</button>
                    </div>
                    <button type="button" className="import-save-layout-link" onClick={beginSaveLayout}>Save this layout for future workbooks</button>
                    {layoutSaveMessage && <p className="import-message success">{layoutSaveMessage}</p>}
                </article>
            </div>

            {showLayoutDialog && (
                <RememberLayoutDialog
                    step="name"
                    layoutName={layoutName}
                    error={layoutError}
                    onLayoutNameChange={(event) => {
                        setLayoutName(event.target.value);
                        setLayoutError("");
                    }}
                    onNotNow={() => setShowLayoutDialog(false)}
                    onSave={saveLayout}
                />
            )}
        </section>
    );
}

export default ImportComplete;

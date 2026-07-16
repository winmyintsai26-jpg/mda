import { useState } from "react";
import { useNavigate } from "react-router-dom";

import UploadCard from "../components/UploadCard";
import { useUpload } from "../context/UploadContext";
import { createPreviewTablesFromAnalysis } from "../utils/previewModel";
import { API_BASE_URL } from "../config/api";
import SavedLayoutMatchDialog from "../saved-layouts/components/SavedLayoutMatchDialog";
import { savedLayoutService } from "../saved-layouts/services/savedLayoutService";
import { layoutMatchingService } from "../saved-layouts/services/layoutMatchingService";
import { savedLayoutApplicationService } from "../saved-layouts/services/savedLayoutApplicationService";
import { createSourceRowSignatures } from "../saved-layouts/models/rowIdentity";
import SaveWorkbookDialog from "../workbooks/SaveWorkbookDialog";
import { useWorkbooks } from "../workbooks/WorkbookContext";

function Dashboard() {
    const navigate = useNavigate();
    const { saveWorkbook } = useWorkbooks();
    const {
        setTable,
        setFileName,
        setAnalysisTables,
        setSelectedTableIndex,
        setAnalysisResult,
        setSelectedWorksheet,
        setWorksheetTables,
        setActiveWorkbookId
    } = useUpload();

    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [layoutMatch, setLayoutMatch] = useState(null);
    const [pendingPreviewTables, setPendingPreviewTables] = useState([]);
    const [pendingWorkbook, setPendingWorkbook] = useState(null);

    const continueToPreview = () => {
        setPendingWorkbook(null);
        navigate("/preview");
    };

    const saveAndContinue = () => {
        if (pendingWorkbook) {
            const saved = saveWorkbook(pendingWorkbook);
            setActiveWorkbookId(saved.id);
        }
        continueToPreview();
    };

    const handleFileChange = (event) => {
        const chosenFile = event.target.files[0];
        setFile(chosenFile);
        setAnalysisTables([]);
        setSelectedTableIndex(null);
        setTable(null);
        setAnalysisResult(null);
        setFileName(chosenFile?.name || "");
        setSelectedWorksheet(null);
        setWorksheetTables({});
        setLayoutMatch(null);
        setPendingPreviewTables([]);
        setPendingWorkbook(null);
        setActiveWorkbookId(null);
    };

    const handleAnalyzeNormally = () => {
        setLayoutMatch(null);
        setPendingWorkbook((current) => current ? { ...current, snapshot: { ...current.snapshot, analysisTables: pendingPreviewTables } } : current);
    };

    const handleApplySavedLayout = () => {
        if (!layoutMatch) {
            handleAnalyzeNormally();
            return;
        }

        let appliedLayout = null;
        try {
            appliedLayout = savedLayoutApplicationService.apply(layoutMatch.layout, pendingPreviewTables);
            setAnalysisTables(appliedLayout.analysisTables);
            setSelectedTableIndex(appliedLayout.selectedTableIndex);
            setSelectedWorksheet(appliedLayout.selectedWorksheet);
            setTable(appliedLayout.activeTable);

            try {
                savedLayoutService.markUsed(layoutMatch.layout.id);
            } catch (error) {
                console.warn("[Dashboard] Saved layout usage date could not be updated.", error);
            }
        } catch (error) {
            console.warn("[Dashboard] Unable to apply saved layout. Continuing with normal analysis.", error);
        }

        setLayoutMatch(null);
        setPendingWorkbook((current) => current ? {
            ...current,
            snapshot: {
                ...current.snapshot,
                analysisTables: appliedLayout?.analysisTables || pendingPreviewTables,
                selectedTableIndex: appliedLayout?.selectedTableIndex ?? current.snapshot.selectedTableIndex,
                selectedWorksheet: appliedLayout?.selectedWorksheet || current.snapshot.selectedWorksheet,
                table: appliedLayout?.activeTable || current.snapshot.table
            }
        } : current);
    };

    const handleAnalyze = async () => {
        if (!file) {
            alert("Please choose an Excel file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsAnalyzing(true);

            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                console.error("[Dashboard] API response not ok:", response.status, response.statusText);
                alert("Analyze failed.");
                return;
            }

            const data = await response.json();

            const previewTables = createPreviewTablesFromAnalysis(data);
            const firstTable = previewTables[0] || { title: "", headers: [], rows: [] };
            const activeTable = {
                title: firstTable.title,
                headers: firstTable.headers,
                rows: firstTable.rows,
                sourceRowSignatures: createSourceRowSignatures(firstTable.rows)
            };

            setAnalysisResult(data);
            setAnalysisTables(previewTables);
            setSelectedTableIndex(previewTables.length === 1 ? 0 : null);
            setFileName(file.name);

            // Initialize worksheetTables to preserve edits per worksheet
            const worksheets = Array.isArray(data?.worksheets) ? data.worksheets : [];
            const firstWorksheetName = worksheets[0]?.sheetName || "Worksheet 1";
            setSelectedWorksheet(firstWorksheetName);
            
            // Initialize empty worksheet tables object
            setWorksheetTables({});

            if (previewTables.length > 0) {
                setTable(activeTable);
            } else {
                setTable({ title: "", headers: [], rows: [] });
            }

            setPendingPreviewTables(previewTables);
            setPendingWorkbook({
                name: file.name,
                sourceType: "excel",
                status: "Editing",
                workflowStep: 2,
                worksheets: worksheets.length,
                rows: previewTables.reduce((sum, item) => sum + (item.rows?.length || 0), 0),
                analysisStatus: "Analyzed",
                validationStatus: previewTables.every((item) => item.validation?.isValid) ? "Valid" : "Needs review",
                lastActivity: "Workbook analyzed and ready for preview",
                snapshot: {
                    fileName: file.name,
                    analysisResult: data,
                    analysisTables: previewTables,
                    selectedTableIndex: previewTables.length === 1 ? 0 : null,
                    selectedWorksheet: firstWorksheetName,
                    worksheetTables: {},
                    table: activeTable
                }
            });

            try {
                const savedLayouts = savedLayoutService.getAll();
                const matchingLayout = layoutMatchingService.findBestMatch(savedLayouts, previewTables);

                if (matchingLayout) {
                    setLayoutMatch(matchingLayout);
                    return;
                }
            } catch (error) {
                console.warn("[Dashboard] Saved layout detection was unavailable. Continuing normally.", error);
            }

            return;
        } catch (err) {
            console.error("[Dashboard] Error during analysis:", err);
            alert("Unable to connect to the server.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-grid" aria-hidden="true" />
            <header className="dashboard-topbar">
                <div className="dashboard-brand">
                    <span className="dashboard-logo" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span>MDA</span>
                </div>
                <span className="dashboard-workspace-label">Workbook workspace</span>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <p className="dashboard-eyebrow">Workbook analysis</p>
                    <h1>Start with your workbook.</h1>
                    <p className="dashboard-subtitle">Upload an Excel workbook to understand its structure and prepare trusted manufacturing data.</p>
                </div>

                <UploadCard
                    file={file}
                    onFileChange={handleFileChange}
                    isAnalyzing={isAnalyzing}
                    onAnalyze={handleAnalyze}
                />

                <div className="dashboard-workflow" aria-label="MDA workbook workflow">
                    {[
                        ["01", "Upload"],
                        ["02", "Analyze"],
                        ["03", "Preview"],
                        ["04", "Validate"],
                        ["05", "Import"]
                    ].map(([number, label], index) => (
                        <div className={`dashboard-workflow-step ${index === 0 ? "is-active" : ""}`} key={label}>
                            <span>{number}</span>
                            <strong>{label}</strong>
                        </div>
                    ))}
                </div>
            </main>

            {layoutMatch && (
                <SavedLayoutMatchDialog
                    match={layoutMatch}
                    onApply={handleApplySavedLayout}
                    onAnalyzeNormally={handleAnalyzeNormally}
                />
            )}
            {!layoutMatch && pendingWorkbook && (
                <SaveWorkbookDialog fileName={pendingWorkbook.name} onSave={saveAndContinue} onContinue={continueToPreview} />
            )}
        </div>
    );
}

export default Dashboard;

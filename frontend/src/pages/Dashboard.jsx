import { useState } from "react";
import { useNavigate } from "react-router-dom";

import UploadCard from "../components/UploadCard";
import { useUpload } from "../context/UploadContext";
import { createPreviewTablesFromAnalysis } from "../utils/previewModel";

function Dashboard() {
    const navigate = useNavigate();
    const {
        setTable,
        setFileName,
        setAnalysisTables,
        setSelectedTableIndex,
        setAnalysisResult,
        setSelectedWorksheet,
        setWorksheetTables
    } = useUpload();

    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

            const response = await fetch("http://localhost:5176/analyze", {
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
                const firstTable = previewTables[0];
                setTable({
                    title: firstTable.title,
                    headers: firstTable.headers,
                    rows: firstTable.rows
                });
            } else {
                setTable({ title: "", headers: [], rows: [] });
            }

            navigate("/preview");
        } catch (err) {
            console.error("[Dashboard] Error during analysis:", err);
            alert("Unable to connect to the server.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Manufacturing Data Platform</h1>
                <p className="dashboard-subtitle">Upload an Excel workbook to analyze and prepare your manufacturing data.</p>
            </div>

            <UploadCard
                file={file}
                onFileChange={handleFileChange}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyze}
            />
        </div>
    );
}

export default Dashboard;

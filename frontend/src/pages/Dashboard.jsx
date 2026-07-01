import { useState } from "react";
import { useNavigate } from "react-router-dom";

import UploadCard from "../components/UploadCard";
import { useUpload } from "../context/UploadContext";

function Dashboard() {
    const navigate = useNavigate();
    const { setTable, setFileName, setAnalysisTables, setSelectedTableIndex } = useUpload();

    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFileChange = (event) => {
        const chosenFile = event.target.files[0];
        setFile(chosenFile);
        setAnalysisTables([]);
        setSelectedTableIndex(null);
        setTable(null);
        setFileName("");
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please choose an Excel file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploading(true);

            const response = await fetch("http://localhost:5176/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                alert("Upload failed.");
                return;
            }

            const data = await response.json();
            const headers = data[0].map((header, index) => ({ id: index, name: header }));
            const body = data.slice(1);

            setTable({ headers, rows: body });
            setFileName(file.name);
            navigate("/preview");
        } catch (err) {
            console.error(err);
            alert("Unable to connect to the server.");
        } finally {
            setIsUploading(false);
        }
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
                alert("Analyze failed.");
                return;
            }

            const data = await response.json();
            const validTables = [];

            data.worksheets?.forEach((worksheet) => {
                worksheet.candidateRegions?.forEach((region, index) => {
                    if (region.tableValidation?.isValid === true) {
                        validTables.push({
                            worksheetName: worksheet.sheetName,
                            rows: region.rows || [],
                            headers: region.headerDetectionResult?.winningHeader?.headerCells ?
                                region.headerDetectionResult.winningHeader.headerCells.slice(-1)[0] : [],
                            rowCount: region.rows?.length || 0,
                            columnCount: region.headerDetectionResult?.winningHeader?.headerCells?.slice(-1)[0]?.length || 0,
                            regionIndex: index
                        });
                    }
                });
            });

            setAnalysisTables(validTables);
            setSelectedTableIndex(validTables.length === 1 ? 0 : null);

            if (validTables.length === 1) {
                const single = validTables[0];
                setTable({ headers: single.headers.map((name, idx) => ({ id: idx, name })), rows: single.rows });
                setFileName(file.name);
                navigate("/preview");
            } else if (validTables.length > 1) {
                setTable({ headers: [], rows: [] });
                setFileName(file.name);
                navigate("/preview?mode=select");
            } else {
                setTable({ headers: [], rows: [] });
                setFileName(file.name);
                navigate("/preview");
            }
        } catch (err) {
            console.error(err);
            alert("Unable to connect to the server.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="dashboard">
            <h1>Manufacturing Data Platform</h1>
            <p className="subtitle">Turn Excel Files into Database Records</p>

            <UploadCard
                file={file}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
                isUploading={isUploading}
            />

            <div className="analyze-controls">
                <button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? "Analyzing..." : "Analyze"}
                </button>
            </div>
        </div>
    );
}

export default Dashboard;

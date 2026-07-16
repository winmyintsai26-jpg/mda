import { createContext, useContext, useMemo, useState } from "react";

/* eslint-disable react-refresh/only-export-components */

const UploadContext = createContext();

export function UploadProvider({ children }) {
    const [table, setTable] = useState(null);
    const [fileName, setFileName] = useState("");
    const [analysisTables, setAnalysisTables] = useState([]);
    const [selectedTableIndex, setSelectedTableIndex] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedWorksheet, setSelectedWorksheet] = useState(null);
    const [worksheetTables, setWorksheetTables] = useState({});  // Store edits per worksheet
    const [importedDataset, setImportedDataset] = useState(null);
    const [activeWorkbookId, setActiveWorkbookId] = useState(null);

    const contextValue = useMemo(() => ({
        table,
        setTable,
        fileName,
        setFileName,
        analysisTables,
        setAnalysisTables,
        selectedTableIndex,
        setSelectedTableIndex,
        analysisResult,
        setAnalysisResult,
        selectedWorksheet,
        setSelectedWorksheet,
        worksheetTables,
        setWorksheetTables,
        importedDataset,
        setImportedDataset,
        activeWorkbookId,
        setActiveWorkbookId
    }), [
        table,
        fileName,
        analysisTables,
        selectedTableIndex,
        analysisResult,
        selectedWorksheet,
        worksheetTables,
        importedDataset,
        activeWorkbookId
    ]);

    return (
        <UploadContext.Provider
            value={contextValue}
        >
            {children}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    return useContext(UploadContext);
}

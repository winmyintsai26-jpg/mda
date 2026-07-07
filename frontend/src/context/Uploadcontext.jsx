import { createContext, useContext, useState } from "react";

const UploadContext = createContext();

export function UploadProvider({ children }) {
    const [table, setTable] = useState(null);
    const [fileName, setFileName] = useState("");
    const [analysisTables, setAnalysisTables] = useState([]);
    const [selectedTableIndex, setSelectedTableIndex] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedWorksheet, setSelectedWorksheet] = useState(null);
    const [worksheetTables, setWorksheetTables] = useState({});  // Store edits per worksheet

    return (
        <UploadContext.Provider
            value={{
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
                setWorksheetTables
            }}
        >
            {children}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    return useContext(UploadContext);
}
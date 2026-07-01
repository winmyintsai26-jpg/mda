import { createContext, useContext, useState } from "react";

const UploadContext = createContext();

export function UploadProvider({ children }) {

    const [table, setTable] = useState(null);

    const [fileName, setFileName] = useState("");
    const [analysisTables, setAnalysisTables] = useState([]);
    const [selectedTableIndex, setSelectedTableIndex] = useState(null);

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
                setSelectedTableIndex
            }}
        >

            {children}

        </UploadContext.Provider>

    );

}

export function useUpload() {

    return useContext(UploadContext);

}
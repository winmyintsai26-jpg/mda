import { createContext, useContext, useState } from "react";

const UploadContext = createContext();

export function UploadProvider({ children }) {

    const [table, setTable] = useState(null);

    const [fileName, setFileName] = useState("");

    return (

        <UploadContext.Provider
            value={{
                table,
                setTable,
                fileName,
                setFileName
            }}
        >

            {children}

        </UploadContext.Provider>

    );

}

export function useUpload() {

    return useContext(UploadContext);

}
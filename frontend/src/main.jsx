import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";

import { UploadProvider } from "./context/UploadContext";
import { WorkbookProvider } from "./workbooks/WorkbookContext";
import { PreferencesProvider } from "./preferences/PreferencesContext";
import { DatabaseConnectionProvider } from "./context/DatabaseConnectionContext";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "./preferences/themes.css";

createRoot(document.getElementById("root")).render(

    <StrictMode>

        <AuthProvider>
            <UploadProvider>
                <DatabaseConnectionProvider>
                    <PreferencesProvider>
                        <WorkbookProvider>
                            <App />
                        </WorkbookProvider>
                    </PreferencesProvider>
                </DatabaseConnectionProvider>
            </UploadProvider>
        </AuthProvider>

    </StrictMode>

);

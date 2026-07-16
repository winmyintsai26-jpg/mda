import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";

import { UploadProvider } from "./context/UploadContext";
import { WorkbookProvider } from "./workbooks/WorkbookContext";

createRoot(document.getElementById("root")).render(

    <StrictMode>

        <UploadProvider>

            <WorkbookProvider>
                <App />
            </WorkbookProvider>

        </UploadProvider>

    </StrictMode>

);

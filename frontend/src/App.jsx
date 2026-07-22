import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import UploadPage from "./pages/Dashboard";
import Import from "./pages/Import";
import ImportComplete from "./pages/ImportComplete";
import Preview from "./pages/Preview";
import AppLayout from "./application/components/AppLayout";
import Analytics from "./application/pages/Analytics";
import WorkbookDetails from "./application/pages/WorkbookDetails";
import Workbooks from "./application/pages/Workbooks";
import Profile from "./application/pages/Profile";
import Connections from "./application/pages/Connections";
import PublicLayout from "./marketing/components/PublicLayout";
import About from "./marketing/pages/About";
import Features from "./marketing/pages/Features";
import Home from "./marketing/pages/Home";
import Login from "./marketing/auth/pages/Login";
import Register from "./marketing/auth/pages/Register";
import ForgotPassword from "./marketing/auth/pages/ForgotPassword";

import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/documentation" element={<Navigate replace to="/" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Navigate replace to="/workbooks" />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/workbooks" element={<Workbooks />} />
                    <Route path="/workbooks/:workbookId" element={<WorkbookDetails />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/connections" element={<Connections />} />
                    <Route path="/settings" element={<Navigate replace to="/workbooks" />} />
                    <Route path="/preview" element={<Preview />} />
                    <Route path="/import-plan" element={<Import />} />
                    <Route path="/import" element={<ImportComplete />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/templates" element={<Navigate replace to="/workbooks" />} />
                    <Route path="/database-connections" element={<Navigate replace to="/connections" />} />
                    <Route path="/import-history" element={<Navigate replace to="/workbooks" />} />
                    <Route path="/help" element={<Navigate replace to="/workbooks" />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;

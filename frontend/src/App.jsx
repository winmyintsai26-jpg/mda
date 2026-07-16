import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import UploadPage from "./pages/Dashboard";
import Import from "./pages/Import";
import Preview from "./pages/Preview";
import AppLayout from "./application/components/AppLayout";
import AppPlaceholderPage from "./application/components/AppPlaceholderPage";
import Analytics from "./application/pages/Analytics";
import AppDashboard from "./application/pages/AppDashboard";
import Connections from "./application/pages/Connections";
import Settings from "./application/pages/Settings";
import WorkbookDetails from "./application/pages/WorkbookDetails";
import Workbooks from "./application/pages/Workbooks";
import PublicLayout from "./marketing/components/PublicLayout";
import About from "./marketing/pages/About";
import Features from "./marketing/pages/Features";
import Home from "./marketing/pages/Home";
import PlaceholderPage from "./marketing/pages/PlaceholderPage";
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
                    <Route
                        path="/documentation"
                        element={(
                            <PlaceholderPage
                                eyebrow="Documentation"
                                title="Documentation is on the way."
                                description="Guides for workbook analysis, validation, database connections, and reusable import templates will live here."
                            />
                        )}
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<AppDashboard />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/workbooks" element={<Workbooks />} />
                    <Route path="/workbooks/:workbookId" element={<WorkbookDetails />} />
                    <Route path="/connections" element={<Connections />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/preview" element={<Preview />} />
                    <Route path="/import" element={<Import />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/templates" element={<Navigate replace to="/workbooks" />} />
                    <Route path="/database-connections" element={<Navigate replace to="/connections" />} />
                    <Route path="/import-history" element={<Navigate replace to="/workbooks" />} />
                    <Route
                        path="/help"
                        element={(
                            <AppPlaceholderPage
                                eyebrow="Support"
                                title="Help"
                                description="Find guidance for analyzing, reviewing, validating, and importing workbooks."
                                icon="help"
                            />
                        )}
                    />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;

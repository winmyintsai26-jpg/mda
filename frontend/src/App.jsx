import { BrowserRouter, Routes, Route } from "react-router-dom";

import UploadPage from "./pages/Dashboard";
import Import from "./pages/Import";
import Preview from "./pages/Preview";
import AppLayout from "./application/components/AppLayout";
import AppPlaceholderPage from "./application/components/AppPlaceholderPage";
import Analytics from "./application/pages/Analytics";
import AppDashboard from "./application/pages/AppDashboard";
import PublicLayout from "./marketing/components/PublicLayout";
import About from "./marketing/pages/About";
import Features from "./marketing/pages/Features";
import Home from "./marketing/pages/Home";
import PlaceholderPage from "./marketing/pages/PlaceholderPage";
import Login from "./marketing/auth/pages/Login";
import Register from "./marketing/auth/pages/Register";

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
                </Route>

                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<AppDashboard />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route
                        path="/templates"
                        element={(
                            <AppPlaceholderPage
                                eyebrow="Reusable workflows"
                                title="Templates"
                                description="Save reviewed workbook structures and reuse them across future imports."
                                icon="templates"
                            />
                        )}
                    />
                    <Route
                        path="/database-connections"
                        element={(
                            <AppPlaceholderPage
                                eyebrow="Customer-owned destinations"
                                title="Database Connections"
                                description="Manage the databases that receive your organization&apos;s approved manufacturing data."
                                icon="connection"
                            />
                        )}
                    />
                    <Route
                        path="/import-history"
                        element={(
                            <AppPlaceholderPage
                                eyebrow="Import records"
                                title="Import History"
                                description="Review completed workbook imports and their validation outcomes."
                                icon="history"
                            />
                        )}
                    />
                    <Route
                        path="/settings"
                        element={(
                            <AppPlaceholderPage
                                eyebrow="Workspace preferences"
                                title="Settings"
                                description="Configure organization, workspace, and future account preferences."
                                icon="settings"
                            />
                        )}
                    />
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

                <Route path="/preview" element={<Preview />} />
                <Route path="/import" element={<Import />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

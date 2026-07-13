import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import Preview from "./pages/Preview";
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

                <Route path="/upload" element={<Dashboard />} />
                <Route path="/preview" element={<Preview />} />
                <Route path="/import" element={<Import />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

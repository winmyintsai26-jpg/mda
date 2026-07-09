import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import Preview from "./pages/Preview";

import "./App.css";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Dashboard />} />

                <Route path="/preview" element={<Preview />} />

                <Route path="/import" element={<Import />} />

            </Routes>

        </BrowserRouter>

    );

}

export default App;
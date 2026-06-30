import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Preview from "./pages/Preview";

import "./App.css";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Dashboard />} />

                <Route path="/preview" element={<Preview />} />

            </Routes>

        </BrowserRouter>

    );

}

export default App;
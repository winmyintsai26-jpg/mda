import { Outlet } from "react-router-dom";

import Footer from "./Footer";
import Navbar from "./Navbar";
import "../styles/public-site.css";

function PublicLayout() {
    return (
        <div className="mda-public-site">
            <Navbar />
            <main className="mda-public-main">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default PublicLayout;

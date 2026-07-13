import { Link, NavLink } from "react-router-dom";

const navItems = [
    { label: "Features", to: "/features" },
    { label: "Documentation", to: "/documentation" },
    { label: "About", to: "/about" }
];

function Navbar() {
    return (
        <header className="mda-public-navbar">
            <nav className="mda-public-container mda-public-nav" aria-label="Primary navigation">
                <Link className="mda-public-brand" to="/" aria-label="MDA home">
                    <span className="mda-public-logo" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span>MDA</span>
                </Link>

                <div className="mda-public-nav-links">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => isActive ? "is-active" : undefined}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="mda-public-nav-actions">
                    <NavLink className="mda-public-login-link" to="/login">Login</NavLink>
                    <Link className="mda-public-button mda-public-button-primary mda-public-button-small" to="/login">
                        Get Started
                    </Link>
                </div>
            </nav>
        </header>
    );
}

export default Navbar;

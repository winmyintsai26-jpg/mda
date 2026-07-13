import { Link } from "react-router-dom";

const footerLinks = [
    { label: "About", to: "/about" },
    { label: "Documentation", to: "/documentation" },
    { label: "Contact", to: "mailto:hello@mda.example", external: true },
    { label: "GitHub", to: "https://github.com/winmyintsai26-jpg/mda", external: true }
];

function Footer() {
    return (
        <footer className="mda-public-footer">
            <div className="mda-public-container mda-public-footer-inner">
                <Link className="mda-public-brand mda-public-footer-brand" to="/" aria-label="MDA home">
                    <span className="mda-public-logo" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span>MDA</span>
                </Link>

                <div className="mda-public-footer-links" aria-label="Footer navigation">
                    {footerLinks.map((item) => item.external ? (
                        <a
                            key={item.label}
                            href={item.to}
                            target={item.to.startsWith("http") ? "_blank" : undefined}
                            rel={item.to.startsWith("http") ? "noreferrer" : undefined}
                        >
                            {item.label}
                        </a>
                    ) : (
                        <Link key={item.label} to={item.to}>{item.label}</Link>
                    ))}
                </div>

                <p className="mda-public-copyright">Built for trusted manufacturing data.</p>
            </div>
        </footer>
    );
}

export default Footer;

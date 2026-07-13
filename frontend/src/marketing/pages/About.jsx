import { Link } from "react-router-dom";

function About() {
    return (
        <>
            <section className="mda-public-page-hero">
                <div className="mda-public-container mda-public-page-hero-inner">
                    <p className="mda-public-eyebrow">About MDA</p>
                    <h1>Manufacturing data starts messy.<br />The destination should not be.</h1>
                    <p>MDA helps teams understand inconsistent Excel workbooks and deliver trusted data to databases they own.</p>
                </div>
            </section>

            <section className="mda-public-section mda-public-page-section">
                <div className="mda-public-container mda-public-story-grid">
                    <div className="mda-public-story-card">
                        <span>01</span>
                        <h2>The problem</h2>
                        <p>Manufacturing spreadsheets often contain merged cells, repeated headers, multiple tables, inconsistent names, and summary sections. Every layout change can create another custom importer.</p>
                    </div>
                    <div className="mda-public-story-card mda-public-story-card-accent">
                        <span>02</span>
                        <h2>The approach</h2>
                        <p>MDA detects the workbook structure, lets a person review the result, validates the data, and imports only approved information into the customer&apos;s chosen database.</p>
                    </div>
                    <div className="mda-public-story-card">
                        <span>03</span>
                        <h2>The principle</h2>
                        <p>Customers remain in control. MDA provides understanding and validation while operational manufacturing data stays in customer-owned systems.</p>
                    </div>
                </div>
            </section>

            <section className="mda-public-cta-section">
                <div className="mda-public-container mda-public-cta-card">
                    <div>
                        <p className="mda-public-eyebrow">See it with your data</p>
                        <h2>Start with a manufacturing workbook.</h2>
                    </div>
                    <Link className="mda-public-button mda-public-button-light" to="/upload">Get Started</Link>
                </div>
            </section>
        </>
    );
}

export default About;

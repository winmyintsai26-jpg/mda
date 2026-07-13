import { Link } from "react-router-dom";

import FeatureCard from "../components/FeatureCard";
import WorkflowTimeline from "../components/WorkflowTimeline";
import features from "../content/features";

function Home() {
    return (
        <>
            <section className="mda-public-hero">
                <div className="mda-public-hero-glow" aria-hidden="true" />
                <div className="mda-public-container mda-public-hero-inner">
                    <p className="mda-public-eyebrow">Manufacturing Data Platform</p>
                    <h1>
                        <span>Understand.</span>
                        <span>Validate.</span>
                        <span>Deliver.</span>
                    </h1>
                    <p className="mda-public-hero-description">
                        Transform messy manufacturing spreadsheets<br className="mda-public-desktop-break" /> into trusted manufacturing data.
                    </p>
                    <div className="mda-public-hero-actions">
                        <Link className="mda-public-button mda-public-button-primary" to="/login">Get Started</Link>
                        <a className="mda-public-button mda-public-button-secondary" href="#workflow">
                            <span className="mda-public-play-icon" aria-hidden="true">▶</span>
                            Watch Demo
                        </a>
                    </div>

                    <div className="mda-public-product-preview" aria-label="Illustration of the MDA workbook pipeline">
                        <div className="mda-public-preview-toolbar">
                            <div className="mda-public-preview-dots" aria-hidden="true"><span /><span /><span /></div>
                            <span>Production_Schedule.xlsx</span>
                            <span className="mda-public-preview-status">Analysis complete</span>
                        </div>
                        <div className="mda-public-preview-body">
                            <aside className="mda-public-preview-sidebar" aria-hidden="true">
                                <span className="is-active" />
                                <span />
                                <span />
                                <span />
                            </aside>
                            <div className="mda-public-preview-content">
                                <div className="mda-public-preview-heading">
                                    <div><span /><span /></div>
                                    <span className="mda-public-preview-badge">Validated</span>
                                </div>
                                <div className="mda-public-preview-grid" aria-hidden="true">
                                    {Array.from({ length: 24 }, (_, index) => <span key={index} />)}
                                </div>
                            </div>
                            <div className="mda-public-preview-insight">
                                <span className="mda-public-insight-label">Detected structure</span>
                                <strong>3 tables</strong>
                                <div><span>Headers</span><b>100%</b></div>
                                <div><span>Data types</span><b>96%</b></div>
                                <div><span>Ready to import</span><b>✓</b></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mda-public-section" id="features">
                <div className="mda-public-container">
                    <div className="mda-public-section-heading">
                        <p className="mda-public-eyebrow">Built for real manufacturing data</p>
                        <h2>From spreadsheet uncertainty<br />to structured confidence.</h2>
                    </div>
                    <div className="mda-public-feature-grid">
                        {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
                    </div>
                </div>
            </section>

            <section className="mda-public-section mda-public-workflow-section" id="workflow">
                <div className="mda-public-container">
                    <div className="mda-public-section-heading mda-public-section-heading-centered">
                        <p className="mda-public-eyebrow">One clear workflow</p>
                        <h2>Messy workbook in.<br />Trusted data out.</h2>
                        <p>MDA keeps people in control at every step before data reaches its destination.</p>
                    </div>
                    <WorkflowTimeline />
                </div>
            </section>

            <section className="mda-public-section mda-public-about-section" id="about">
                <div className="mda-public-container mda-public-about-grid">
                    <div>
                        <p className="mda-public-eyebrow">About MDA</p>
                        <h2>Built around the way manufacturing data actually arrives.</h2>
                    </div>
                    <div className="mda-public-about-copy">
                        <p>MDA helps manufacturing companies understand messy Excel workbooks before importing trusted data into customer-owned databases.</p>
                        <p>It identifies workbook structure, gives teams a clear review step, and keeps operational data under the customer&apos;s control.</p>
                        <Link className="mda-public-text-link" to="/about">Learn more about MDA <span aria-hidden="true">→</span></Link>
                    </div>
                </div>
            </section>

            <section className="mda-public-cta-section">
                <div className="mda-public-container mda-public-cta-card">
                    <div>
                        <p className="mda-public-eyebrow">Start with your workbook</p>
                        <h2>Turn the spreadsheet you have<br />into the data you trust.</h2>
                    </div>
                    <Link className="mda-public-button mda-public-button-light" to="/login">Open MDA</Link>
                </div>
            </section>
        </>
    );
}

export default Home;

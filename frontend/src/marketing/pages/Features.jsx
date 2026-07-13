import { Link } from "react-router-dom";

import FeatureCard from "../components/FeatureCard";
import WorkflowTimeline from "../components/WorkflowTimeline";
import features from "../content/features";

function Features() {
    return (
        <>
            <section className="mda-public-page-hero">
                <div className="mda-public-container mda-public-page-hero-inner">
                    <p className="mda-public-eyebrow">Features</p>
                    <h1>Understand the workbook<br />before you move the data.</h1>
                    <p>MDA brings workbook detection, human review, validation, and customer-owned delivery into one focused workflow.</p>
                </div>
            </section>

            <section className="mda-public-section mda-public-page-section">
                <div className="mda-public-container">
                    <div className="mda-public-feature-grid">
                        {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
                    </div>
                </div>
            </section>

            <section className="mda-public-section mda-public-workflow-section">
                <div className="mda-public-container">
                    <div className="mda-public-section-heading mda-public-section-heading-centered">
                        <p className="mda-public-eyebrow">The MDA workflow</p>
                        <h2>Review before delivery.</h2>
                    </div>
                    <WorkflowTimeline />
                    <div className="mda-public-centered-action">
                        <Link className="mda-public-button mda-public-button-primary" to="/upload">Analyze a workbook</Link>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Features;

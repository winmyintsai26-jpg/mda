import AppIcon from "../components/AppIcon";

const modules = [
    { title: "Overview", description: "A consolidated view of operational manufacturing performance." },
    { title: "Inventory", description: "Understand stock position, movement, and coverage." },
    { title: "Production", description: "Review production activity, output, and scheduling signals." },
    { title: "Shipping", description: "Explore shipment volume, timing, and delivery status." },
    { title: "Quality", description: "Surface validation trends and future quality indicators." },
    { title: "Reports", description: "Prepare reusable operational summaries for your team." }
];

function Analytics() {
    return (
        <section className="mda-app-page mda-app-analytics-page">
            <header className="mda-app-page-heading">
                <div>
                    <p>Analytics</p>
                    <h1>Turn trusted data into clarity.</h1>
                    <span>Analytics modules will help manufacturing teams explore their imported operational data while keeping decisions in human hands.</span>
                </div>
                <span className="mda-app-coming-badge">Foundation preview</span>
            </header>

            <div className="mda-app-analytics-grid">
                {modules.map((module, index) => (
                    <article className="mda-app-analytics-card" key={module.title}>
                        <div>
                            <span className="mda-app-analytics-icon"><AppIcon name="analytics" size={21} /></span>
                            <small>{String(index + 1).padStart(2, "0")}</small>
                        </div>
                        <h2>{module.title}</h2>
                        <p>{module.description}</p>
                        <span>Coming soon</span>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Analytics;

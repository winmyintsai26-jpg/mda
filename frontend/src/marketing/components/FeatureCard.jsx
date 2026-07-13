const icons = {
    analysis: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
            <path d="M4 9h16M9 4v16M14.5 12.5l1 1 2-2.5" />
        </svg>
    ),
    database: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <ellipse cx="12" cy="6" rx="7" ry="3" />
            <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
        </svg>
    ),
    code: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
        </svg>
    )
};

function FeatureCard({ number, title, description, icon }) {
    return (
        <article className="mda-public-feature-card">
            <div className="mda-public-feature-card-top">
                <span className="mda-public-feature-icon" aria-hidden="true">{icons[icon]}</span>
                <span className="mda-public-feature-number">{number}</span>
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
        </article>
    );
}

export default FeatureCard;

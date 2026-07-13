const iconPaths = {
    analytics: (
        <>
            <path d="M5 19V11M12 19V5M19 19v-8" />
            <path d="M3.5 19.5h17" />
        </>
    ),
    connection: (
        <>
            <ellipse cx="12" cy="5.5" rx="7" ry="3" />
            <path d="M5 5.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6M5 11.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
        </>
    ),
    dashboard: (
        <>
            <rect x="4" y="4" width="6" height="6" rx="1.5" />
            <rect x="14" y="4" width="6" height="6" rx="1.5" />
            <rect x="4" y="14" width="6" height="6" rx="1.5" />
            <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </>
    ),
    help: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M9.8 9.2a2.4 2.4 0 0 1 4.65.83c0 1.8-2.45 2-2.45 3.7M12 17.25h.01" />
        </>
    ),
    history: (
        <>
            <path d="M4 5v5h5" />
            <path d="M5.25 15.5A8 8 0 1 0 5 8.5L4 10" />
            <path d="M12 8v4.25l2.75 1.5" />
        </>
    ),
    settings: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21H9.55v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H2.4V9.55h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88L3.7 6.56 6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V2.4h4.05v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5c.12.4.34.74.66 1 .29.25.66.39 1.04.4h.1v4.05h-.1a1.7 1.7 0 0 0-1.7 1.05Z" />
        </>
    ),
    templates: (
        <>
            <rect x="4" y="3.5" width="16" height="17" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
        </>
    ),
    upload: (
        <>
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
            <path d="M5 14.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5" />
        </>
    )
};

function AppIcon({ name, size = 20 }) {
    return (
        <svg
            className="mda-app-icon"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            {iconPaths[name] || iconPaths.dashboard}
        </svg>
    );
}

export default AppIcon;

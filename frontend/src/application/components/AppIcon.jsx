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
    clock: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7v5l3.5 2" />
        </>
    ),
    settings: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21H9.55v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H2.4V9.55h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88L3.7 6.56 6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V2.4h4.05v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5c.12.4.34.74.66 1 .29.25.66.39 1.04.4h.1v4.05h-.1a1.7 1.7 0 0 0-1.7 1.05Z" />
        </>
    ),
    search: (
        <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 4 4" />
        </>
    ),
    workflow: (
        <>
            <circle cx="5" cy="12" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" />
            <path d="M7 12h4a4 4 0 0 0 4-4V6h2M11 12a4 4 0 0 1 4 4v2h2" />
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
    ),
    workbook: (
        <>
            <path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5Z" />
            <path d="M14 3.5V8h4M8 12h7M8 16h7" />
        </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    rows: (
        <>
            <path d="M5 7h14M5 12h14M5 17h14" />
            <circle cx="3" cy="7" r=".5" /><circle cx="3" cy="12" r=".5" /><circle cx="3" cy="17" r=".5" />
        </>
    ),
    sheet: (
        <>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 10h16M10 4v16" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.7-3.5 3.05-5.5 7-5.5s6.3 2 7 5.5" />
        </>
    ),
    security: (
        <>
            <path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" />
            <path d="m9 12 2 2 4-4" />
        </>
    ),
    appearance: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 3.5a8.5 8.5 0 0 0 0 17c-2.2-2.6-2.2-14.4 0-17Z" />
        </>
    ),
    bell: (
        <>
            <path d="M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Z" />
            <path d="M10 20h4" />
        </>
    ),
    about: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 10.5V17M12 7h.01" />
        </>
    ),
    edit: <path d="m4 17-.5 3.5L7 20l11-11-3-3L4 17ZM13.5 7.5l3 3" />,
    trash: (
        <>
            <path d="M5 7h14M9 7V4h6v3M7 7l1 14h8l1-14" />
            <path d="M10 11v6M14 11v6" />
        </>
    ),
    test: (
        <>
            <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.75 3h10.5A2 2 0 0 0 19 18l-5-9V3" />
            <path d="M7.5 16h9" />
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

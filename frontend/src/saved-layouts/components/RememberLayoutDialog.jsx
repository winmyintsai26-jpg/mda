import { useEffect, useRef } from "react";

import "../styles/saved-layout.css";

function RememberLayoutDialog({
    step,
    insertedRowCount,
    database,
    table,
    layoutName,
    error,
    onLayoutNameChange,
    onRemember,
    onNotNow,
    onSave
}) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (step === "name") {
            inputRef.current?.focus();
        }
    }, [step]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onNotNow();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onNotNow]);

    return (
        <div className="mda-layout-dialog-overlay" role="presentation">
            <section
                className="mda-layout-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mda-layout-dialog-title"
                aria-describedby="mda-layout-dialog-description"
            >
                {step === "success" ? (
                    <>
                        <span className="mda-layout-success-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="m7.5 12.5 3 3 6-7" />
                            </svg>
                        </span>
                        <p className="mda-layout-dialog-eyebrow">Import completed</p>
                        <h2 id="mda-layout-dialog-title">Your data was imported successfully.</h2>
                        <p id="mda-layout-dialog-description" className="mda-layout-dialog-copy">
                            Would you like MDA to remember this workbook layout for future uploads?
                        </p>

                        <dl className="mda-layout-import-summary">
                            <div>
                                <dt>Destination</dt>
                                <dd>{database}.{table}</dd>
                            </div>
                            <div>
                                <dt>Rows imported</dt>
                                <dd>{typeof insertedRowCount === "number" ? insertedRowCount : "Completed"}</dd>
                            </div>
                        </dl>

                        <div className="mda-layout-dialog-actions">
                            <button type="button" className="mda-layout-primary-button" onClick={onRemember}>Remember Layout</button>
                            <button type="button" className="mda-layout-secondary-button" onClick={onNotNow}>Not Now</button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={onSave}>
                        <span className="mda-layout-name-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <rect x="4" y="3.5" width="16" height="17" rx="2" />
                                <path d="M8 8h8M8 12h8M8 16h5" />
                            </svg>
                        </span>
                        <p className="mda-layout-dialog-eyebrow">Remember workbook layout</p>
                        <h2 id="mda-layout-dialog-title">Name this layout.</h2>
                        <p id="mda-layout-dialog-description" className="mda-layout-dialog-copy">
                            Use a clear name your team will recognize when this workbook pattern appears again.
                        </p>

                        <label className="mda-layout-name-field">
                            <span>Layout Name</span>
                            <input
                                ref={inputRef}
                                value={layoutName}
                                onChange={onLayoutNameChange}
                                placeholder="Production Schedule"
                                maxLength={100}
                                aria-invalid={Boolean(error)}
                                aria-describedby={error ? "mda-layout-name-error" : undefined}
                            />
                        </label>
                        {error && <p className="mda-layout-dialog-error" id="mda-layout-name-error" role="alert">{error}</p>}

                        <div className="mda-layout-dialog-actions">
                            <button type="submit" className="mda-layout-primary-button">Save</button>
                            <button type="button" className="mda-layout-secondary-button" onClick={onNotNow}>Cancel</button>
                        </div>
                    </form>
                )}
            </section>
        </div>
    );
}

export default RememberLayoutDialog;

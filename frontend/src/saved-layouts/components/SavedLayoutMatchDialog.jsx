import "../styles/saved-layout.css";

function SavedLayoutMatchDialog({ match, onApply, onAnalyzeNormally }) {
    return (
        <div className="mda-layout-dialog-overlay" role="presentation">
            <section
                className="mda-layout-dialog mda-layout-match-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mda-layout-match-title"
                aria-describedby="mda-layout-match-description"
            >
                <span className="mda-layout-match-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="3.5" width="16" height="17" rx="2" />
                        <path d="M8 8h8M8 12h5M8 16h4" />
                        <path d="m15.5 15.5 1.5 1.5 3-3" />
                    </svg>
                </span>
                <p className="mda-layout-dialog-eyebrow">Saved Layout Found</p>
                <h2 id="mda-layout-match-title">{match.layout.name}</h2>
                <p id="mda-layout-match-description" className="mda-layout-dialog-copy">
                    This workbook closely matches a layout you previously saved.
                </p>

                <div className="mda-layout-accuracy-card">
                    <span>Match Accuracy</span>
                    <strong>{match.accuracy}%</strong>
                    <div aria-hidden="true"><span style={{ width: `${match.accuracy}%` }} /></div>
                </div>

                <div className="mda-layout-differences">
                    <h3>Differences</h3>
                    <ul>
                        {match.differences.map((difference) => <li key={difference}>{difference}</li>)}
                    </ul>
                </div>

                <div className="mda-layout-dialog-actions">
                    <button type="button" className="mda-layout-primary-button" onClick={onApply}>Apply Saved Layout</button>
                    <button type="button" className="mda-layout-secondary-button" onClick={onAnalyzeNormally}>Analyze Normally</button>
                </div>
            </section>
        </div>
    );
}

export default SavedLayoutMatchDialog;

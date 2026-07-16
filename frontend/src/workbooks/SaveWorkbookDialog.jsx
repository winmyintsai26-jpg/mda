function SaveWorkbookDialog({ fileName, onSave, onContinue }) {
    return (
        <div className="mda-save-workbook-overlay" role="presentation">
            <section className="mda-save-workbook-dialog" role="dialog" aria-modal="true" aria-labelledby="save-workbook-title">
                <span className="mda-save-workbook-icon" aria-hidden="true">✓</span>
                <p>Analysis complete</p>
                <h2 id="save-workbook-title">Save this analysis as a Workbook?</h2>
                <div>Keep {fileName || "this workbook"} in MDA so you can reopen the preview, validation results, and continue the workflow later.</div>
                <footer>
                    <button type="button" className="mda-workspace-secondary-button" onClick={onContinue}>No, continue</button>
                    <button type="button" className="mda-workspace-primary-button" onClick={onSave}>Yes, save Workbook</button>
                </footer>
            </section>
        </div>
    );
}

export default SaveWorkbookDialog;

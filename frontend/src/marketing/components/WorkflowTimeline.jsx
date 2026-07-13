const defaultSteps = ["Upload", "Analyze", "Review", "Validate", "Import"];

function WorkflowTimeline({ steps = defaultSteps }) {
    return (
        <ol className="mda-public-workflow-timeline" aria-label="MDA workbook workflow">
            {steps.map((step, index) => (
                <li key={step} className="mda-public-workflow-step">
                    <div className="mda-public-workflow-node">
                        <span className="mda-public-workflow-number">{String(index + 1).padStart(2, "0")}</span>
                        <strong>{step}</strong>
                    </div>
                    {index < steps.length - 1 && (
                        <span className="mda-public-workflow-arrow" aria-hidden="true">→</span>
                    )}
                </li>
            ))}
        </ol>
    );
}

export default WorkflowTimeline;

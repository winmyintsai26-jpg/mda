const workflowSteps = ["Upload Workbook", "Review & Edit", "Smart Import Plan", "Import", "Business Analysis"];

const routeStepIndex = {
    "/upload": 0,
    "/preview": 1,
    "/import-plan": 2,
    "/import": 3,
    "/analytics": 4
};

function WorkflowProgress({ pathname }) {
    const activeIndex = routeStepIndex[pathname] ?? 0;

    return (
        <div className="mda-app-workflow-progress" aria-label="Workbook workflow">
            <ol>
                {workflowSteps.map((step, index) => {
                    const state = index < activeIndex ? "is-complete" : index === activeIndex ? "is-active" : "";

                    return (
                        <li className={state} key={step} aria-current={index === activeIndex ? "step" : undefined}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>{step}</strong>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export default WorkflowProgress;

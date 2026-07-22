export function createImportExecutor(run) {
    const executions = new Map();

    return function executeOnce(plan) {
        if (!executions.has(plan.id)) executions.set(plan.id, Promise.resolve().then(() => run(plan)));
        return executions.get(plan.id);
    };
}

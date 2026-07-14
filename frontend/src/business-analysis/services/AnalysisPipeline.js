export class AnalysisPipeline {
    constructor(stages = []) {
        this.stages = [...stages];
    }

    register(stage) {
        return new AnalysisPipeline([...this.stages, stage]);
    }

    run(initialContext) {
        return this.stages.reduce((context, stage) => {
            if (typeof stage === "function") return stage(context);
            if (stage && typeof stage.analyze === "function") return stage.analyze(context);
            throw new TypeError("Analysis pipeline stages must be functions or expose an analyze(context) method.");
        }, initialContext);
    }
}

import { API_BASE_URL } from "../../config/api.js";
import { AiAnalysisProvider } from "./AiAnalysisProvider.js";

export class LocalAiAnalysisProvider extends AiAnalysisProvider {
    constructor(endpoint = `${API_BASE_URL}/ai/analysis/explain`) {
        super();
        this.endpoint = endpoint;
    }

    async explain({ question, conversation, evidence }) {
        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question,
                conversation: conversation.slice(-8).map(({ role, content }) => ({ role, content })),
                evidence
            })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.message || "Local AI is unavailable. Start the configured local model and try again.");
        }
        return payload;
    }
}

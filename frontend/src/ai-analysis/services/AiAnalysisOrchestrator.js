import { runApprovedAnalysisTool } from "../tools/approvedAnalysisTools.js";

export class AiAnalysisOrchestrator {
    constructor(provider) {
        this.provider = provider;
    }

    async ask({ question, conversation, analysis }) {
        const recentUserContext = conversation
            .filter((message) => message.role === "user")
            .slice(-3)
            .map((message) => message.content);
        const routingQuestion = [...recentUserContext, question].join(" ");
        const providerConversation = conversation.at(-1)?.role === "user"
            && conversation.at(-1)?.content === question
            ? conversation.slice(0, -1)
            : conversation;
        const evidence = runApprovedAnalysisTool(analysis, routingQuestion);
        const response = await this.provider.explain({ question, conversation: providerConversation, evidence });
        return {
            content: response.content,
            evidence,
            provider: response.provider || "local"
        };
    }
}

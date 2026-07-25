import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AiAnalysisOrchestrator } from "../../ai-analysis/services/AiAnalysisOrchestrator.js";
import { LocalAiAnalysisProvider } from "../../ai-analysis/providers/LocalAiAnalysisProvider.js";
import { useAiAnalysisContext } from "../../ai-analysis/services/useAiAnalysisContext.js";
import { useUpload } from "../../context/UploadContext.jsx";
import "../../ai-analysis/ai-analysis.css";

const SUGGESTED_QUESTIONS = [
    "Why did production decrease?",
    "Which line performed worst?",
    "What should I investigate?",
    "Are there unusual values?"
];

function MdaLogo({ message = false }) {
    return <span className={`mda-ai-logo${message ? " is-message" : ""}`} aria-label={message ? "MDA" : undefined} aria-hidden={message ? undefined : "true"}><span /><span /><span /></span>;
}

function InlineMarkdown({ text }) {
    return String(text).split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**")
            ? <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
            : part
    );
}

function isTableSeparator(line) {
    return /^\|?[\s:|-]+\|[\s:|-|]*\|?$/.test(line);
}

function tableCells(line) {
    return line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function ResponseBody({ content }) {
    const lines = String(content || "").split("\n");
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index].trim();
        if (!line) {
            index += 1;
            continue;
        }

        if (line.startsWith("|") && isTableSeparator(lines[index + 1] || "")) {
            const header = tableCells(line);
            index += 2;
            const rows = [];
            while (index < lines.length && lines[index].trim().startsWith("|")) {
                rows.push(tableCells(lines[index].trim()));
                index += 1;
            }
            blocks.push(
                <div className="mda-ai-response-table-wrap" key={`table-${blocks.length}`}>
                    <table className="mda-ai-response-table">
                        <thead><tr>{header.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
                        <tbody>{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}><InlineMarkdown text={cell} /></td>)}</tr>)}</tbody>
                    </table>
                </div>
            );
            continue;
        }

        if (/^[-*]\s+/.test(line)) {
            const items = [];
            while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
                index += 1;
            }
            blocks.push(<ul key={`list-${blocks.length}`}>{items.map((item) => <li key={item}><InlineMarkdown text={item} /></li>)}</ul>);
            continue;
        }

        blocks.push(<p key={`paragraph-${blocks.length}`}><InlineMarkdown text={line} /></p>);
        index += 1;
    }

    return <div className="mda-ai-response-body">{blocks}</div>;
}

function Evidence({ evidence }) {
    if (!evidence?.facts?.length) return null;
    return (
        <div className="mda-ai-evidence">
            <strong>Evidence</strong>
            <div className="mda-ai-evidence-facts">
                {evidence.facts.map((fact) => <span key={`${fact.label}-${fact.value}`}>{fact.label}: <b>{fact.value}</b></span>)}
            </div>
            <small>Calculated by MDA · {evidence.source.rowIndices.length.toLocaleString("en-US")} supporting row{evidence.source.rowIndices.length === 1 ? "" : "s"}</small>
        </div>
    );
}

function Composer({ disabled, isThinking, onChange, onSubmit, value }) {
    const submit = (event) => {
        event.preventDefault();
        onSubmit();
    };
    return (
        <form className="mda-ai-composer" onSubmit={submit}>
            <div className="mda-ai-composer-box">
                <textarea
                    aria-label="Ask MDA about this workbook"
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            onSubmit();
                        }
                    }}
                    placeholder="Ask anything about this workbook..."
                    rows="1"
                    value={value}
                />
                <button className="mda-ai-send" type="submit" aria-label="Send question" disabled={disabled || isThinking || !value.trim()}>↑</button>
            </div>
            <small>MDA calculates verified evidence before the local AI explains it.</small>
        </form>
    );
}

function AiAnalysis() {
    const { importedDataset } = useUpload();
    const analysis = useAiAnalysisContext(importedDataset);
    const orchestrator = useMemo(() => new AiAnalysisOrchestrator(new LocalAiAnalysisProvider()), []);
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    const ask = async (suggestedQuestion) => {
        const nextQuestion = String(suggestedQuestion || question).trim();
        if (!analysis || !nextQuestion || isThinking) return;

        const userMessage = { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-user`, role: "user", content: nextQuestion };
        const conversation = [...messages, userMessage];
        setMessages(conversation);
        setQuestion("");
        setIsThinking(true);

        try {
            const result = await orchestrator.ask({ question: nextQuestion, conversation, analysis });
            setMessages((current) => [...current, {
                id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-assistant`,
                role: "assistant",
                content: result.content,
                evidence: result.evidence
            }]);
        } catch (error) {
            setMessages((current) => [...current, {
                id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-error`,
                role: "assistant",
                content: error.message || "MDA could not reach the configured local AI provider.",
                isError: true
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    if (!analysis) {
        return (
            <section className="mda-ai-page">
                <div className="mda-ai-conversation-shell">
                    <div className="mda-ai-empty mda-ai-no-data">
                        <MdaLogo />
                        <h1>Ask MDA about your data</h1>
                        <p>Import a workbook first. AI Analysis uses the verified results calculated from the current imported workbook.</p>
                        <Link to="/upload">Upload Workbook</Link>
                    </div>
                </div>
            </section>
        );
    }

    if (messages.length === 0) {
        return (
            <section className="mda-ai-page">
                <div className="mda-ai-conversation-shell">
                    <div className="mda-ai-empty">
                        <MdaLogo />
                        <h1>Ask MDA about your data</h1>
                        <p>Ask questions about trends, production, rejects, anomalies, or anything else in this workbook.</p>
                        <div className="mda-ai-suggestions">
                            {SUGGESTED_QUESTIONS.map((prompt) => <button type="button" key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}
                        </div>
                        <Composer disabled={!analysis} isThinking={isThinking} onChange={setQuestion} onSubmit={() => ask()} value={question} />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mda-ai-page">
            <div className="mda-ai-conversation-shell">
                <div className="mda-ai-thread">
                    <header className="mda-ai-thread-header">
                        <p>AI Analysis</p>
                        <h1>{analysis.source.name}</h1>
                        <span>Answers are grounded in the current workbook&apos;s verified Business Analysis results.</span>
                    </header>
                    <div className="mda-ai-messages" aria-live="polite">
                        {messages.map((message) => message.role === "user"
                            ? <article className="mda-ai-message is-user" key={message.id}><p>{message.content}</p></article>
                            : <article className={`mda-ai-message is-assistant${message.isError ? " is-error" : ""}`} key={message.id}>
                                <MdaLogo message />
                                <div className="mda-ai-assistant-copy">
                                    <strong>MDA</strong>
                                    <ResponseBody content={message.content} />
                                    <Evidence evidence={message.evidence} />
                                </div>
                            </article>)}
                        {isThinking && <article className="mda-ai-message is-assistant"><MdaLogo message /><div className="mda-ai-thinking" aria-label="MDA is investigating"><i /><i /><i /></div></article>}
                    </div>
                </div>
                <div className="mda-ai-active-composer">
                    <Composer disabled={!analysis} isThinking={isThinking} onChange={setQuestion} onSubmit={() => ask()} value={question} />
                </div>
            </div>
        </section>
    );
}

export default AiAnalysis;

import { useState, type FormEvent } from 'react';
import { Bot, MessageCircle, Send, Shield, X } from 'lucide-react';
import type { Hazard, Route } from '../../types';

interface SafetyChatProps {
    route: Route;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function SafetyChat({ route }: SafetyChatProps) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Hi! I can explain route scores, summarize reported hazards, and offer general pedestrian-safety guidance. I cannot verify live conditions or contact emergency services.',
        },
    ]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const content = input.trim();
        if (!content || sending) return;

        const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
        setMessages(nextMessages);
        setInput('');
        setError(null);
        setSending(true);

        try {
            const response = await fetch('/.netlify/functions/safety-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: nextMessages.slice(-11),
                    context: {
                        routeName: route.name,
                        safetyScore: route.safetyScoreAvailable === false ? null : route.safetyScore,
                        lightingPercent: route.safetyScoreAvailable === false ? null : Math.round(route.lightingRatio * 100),
                        safeHubCount: route.safetyScoreAvailable === false ? null : route.safeHubs.length,
                        hazards: route.hazards.slice(0, 20).map((hazard: Hazard) => ({
                            type: hazard.type,
                            label: hazard.label,
                            severity: hazard.severity,
                            upvotes: hazard.upvotes,
                        })),
                    },
                }),
            });
            const payload = await response.json() as { reply?: string; error?: string };
            if (!response.ok || !payload.reply) {
                throw new Error(payload.error ?? 'The safety assistant is temporarily unavailable.');
            }
            setMessages((current) => [...current, { role: 'assistant', content: payload.reply ?? '' }]);
        } catch (chatError) {
            setError(chatError instanceof Error ? chatError.message : 'Unable to reach the safety assistant.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-[1200]">
            {open && (
                <section className="mb-3 flex h-[min(32rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" aria-label="SafeRoute AI assistant">
                    <header className="flex items-center gap-2 bg-indigo-700 px-4 py-3 text-white">
                        <Bot className="h-5 w-5" />
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold">Safety Assistant</h2>
                            <p className="truncate text-[10px] text-indigo-100">Context: {route.name}</p>
                        </div>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded p-1 hover:bg-indigo-600">
                            <X className="h-4 w-4" />
                        </button>
                    </header>
                    <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3" aria-live="polite">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-[10px] leading-relaxed text-blue-900">
                            <Shield className="mr-1 inline h-3 w-3" />
                            Your message and this route&apos;s safety summary are sent to the configured AI provider. Do not share personal or emergency information.
                        </div>
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-relaxed ${
                                    message.role === 'user'
                                        ? 'ml-auto bg-indigo-700 text-white'
                                        : 'border border-slate-200 bg-white text-slate-800'
                                }`}
                            >
                                {message.content}
                            </div>
                        ))}
                        {sending && <p className="text-xs text-slate-500">Thinking…</p>}
                        {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
                    </div>
                    <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 bg-white p-3">
                        <label className="sr-only" htmlFor="safety-chat-input">Ask the safety assistant</label>
                        <input
                            id="safety-chat-input"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            maxLength={1000}
                            placeholder="Ask about this route…"
                            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="rounded-md bg-indigo-700 px-3 text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </section>
            )}
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-label={open ? 'Close safety assistant' : 'Open safety assistant'}
                className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-700 text-white shadow-lg transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
            >
                {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            </button>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AgentUI = () => {
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<{ role: 'user' | 'agent', text: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [results, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const userMsg = prompt;
        setResults(prev => [...prev, { role: 'user', text: userMsg }]);
        setPrompt('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMsg }),
            });

            const data = await response.json();
            setResults(prev => [...prev, { role: 'agent', text: data.response || 'No response from agent.' }]);
        } catch (err) {
            setResults(prev => [...prev, { role: 'agent', text: 'Error: Could not connect to agent.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 flex flex-col h-[85vh] mt-4">
            <header className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 animate-pulse" />
                    <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Agent_B1997
                    </h1>
                </div>
                <div className="text-xs text-slate-500 font-mono tracking-widest uppercase">Neural Interface</div>
            </header>

            <div
                ref={scrollRef}
                className="flex-1 space-y-6 mb-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent custom-scrollbar"
            >
                {results.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 select-none text-center px-4">
                        <div className="w-16 h-16 mb-6 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center">
                            <span className="text-4xl text-slate-400 mt-[-4px]">?</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-300 mb-2">Agent_B1997</h2>
                        <p className="text-slate-400 italic mb-4 max-w-md">
                            Your gateway to Model Context Protocol (MCP) tools.
                        </p>
                        <p className="text-sm text-slate-500">
                            Ready to assist with weather, user info, or the current time.
                        </p>
                    </div>
                )}

                {results.map((res, i) => (
                    <div key={i} className={`flex ${res.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`group relative max-w-[85%] px-4 py-3 rounded-2xl shadow-lg ${res.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                            }`}>
                            {res.role === 'agent' ? (
                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {res.text}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{res.text}</div>
                            )}

                            <div className={`absolute -bottom-5 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ${res.role === 'user' ? 'right-0' : 'left-0'
                                }`}>
                                {res.role === 'user' ? 'You' : 'Agent'}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-none flex gap-2 items-center">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                            </div>
                            <span className="text-sm text-slate-400 ml-1">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-slate-800">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask something... (e.g. what's the weather?)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-100 placeholder:text-slate-500"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                    {loading ? '...' : 'Send'}
                </button>
            </form>

            <footer className="mt-4 text-center">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                    System Online
                </p>
            </footer>
        </div>
    );
};

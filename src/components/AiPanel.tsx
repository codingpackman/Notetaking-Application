'use client';

import { useAppStore } from '@/store/useAppStore';
import { Trash2, Brain, BookOpen, HelpCircle, FileText } from 'lucide-react';
import { AiHistoryItem } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useState } from 'react';
import { Send, MessageSquare, Sparkles } from 'lucide-react';

export default function AiPanel() {
  const aiHistory = useAppStore((state) => state.aiHistory);
  const clearAiHistory = useAppStore((state) => state.clearAiHistory);
  const addAiHistoryItem = useAppStore((state) => state.addAiHistoryItem);
  const updateAiHistoryItem = useAppStore((state) => state.updateAiHistoryItem);

  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Latest item is context for chat
  const latestItem = aiHistory.length > 0 ? aiHistory[0] : null;

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const message = chatInput.trim();
    if (!message || isSending) return;

    setChatInput('');
    setIsSending(true);

    const tempId = String(Date.now());
    const contextSnippet = latestItem
      ? (latestItem.type === 'chat' ? latestItem.response.substring(0, 80) : latestItem.highlightedText.substring(0, 80))
      : 'General Question';

    addAiHistoryItem({
      id: tempId,
      type: 'chat',
      highlightedText: `Q: ${message}`,
      response: 'Thinking...',
    });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          userMessage: message,
          contextText: latestItem ? latestItem.response : '',
          text: latestItem ? latestItem.highlightedText : '',
        }),
      });

      const data = await res.json();
      if (data.result) {
        updateAiHistoryItem(tempId, { response: data.result });
      } else {
        updateAiHistoryItem(tempId, { response: `Error: ${data.error || 'Failed to get answer'}` });
      }
    } catch (err: any) {
      updateAiHistoryItem(tempId, { response: `Error: ${err.message || 'Failed to connect'}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80 border-l border-slate-200/80 backdrop-blur-sm">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
          </div>
          <h2 className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl tracking-tight text-white">AI Assistant</h2>
        </div>
        {aiHistory.length > 0 && (
          <button
            onClick={clearAiHistory}
            className="p-1.5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 rounded-lg transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* History Card List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {aiHistory.length === 0 ? (
          <div className="text-center text-slate-400 mt-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <Brain className="w-6 h-6" />
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-600">No study notes yet</p>
            <p className="text-xs sm:text-sm text-slate-400">
              Highlight text in any PDF to generate summaries, practice questions, flashcards, or chat with AI.
            </p>
          </div>
        ) : (
          aiHistory.map((item) => (
            <AiResponseCard key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Bottom Chat Section */}
      <div className="p-3 border-t border-slate-200 bg-white/90 backdrop-blur shadow-lg">
        {latestItem && (
          <div className="mb-2 px-2 py-1 bg-indigo-50/70 border border-indigo-100 rounded text-[11px] sm:text-xs text-indigo-700 truncate flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="font-medium shrink-0">Replying to latest:</span>
            <span className="truncate italic">{latestItem.highlightedText || 'Previous Response'}</span>
          </div>
        )}

        <form onSubmit={handleSendChat} className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={latestItem ? "Ask a follow-up question..." : "Ask AI a question..."}
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isSending}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition-all shadow-sm flex items-center justify-center"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function AiResponseCard({ item }: { item: AiHistoryItem }) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'summary':
        return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Summary' };
      case 'question_hard':
        return { icon: HelpCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Hard Question' };
      case 'question_review':
        return { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: 'Review Question' };
      case 'question_tricky':
        return { icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', label: 'Tricky Question' };
      case 'flashcards':
        return { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Flashcards' };
      case 'chat':
        return { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', label: 'Follow-up Chat' };
      default:
        return { icon: Brain, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', label: 'AI Response' };
    }
  };

  const config = getTypeConfig(item.type);
  const Icon = config.icon;

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white ${config.border}`}>
      <div className={`px-3 py-2 border-b flex items-center justify-between text-xs sm:text-sm font-semibold ${config.bg} ${config.color} ${config.border}`}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span>{config.label}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-normal">
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="p-3 bg-white">
        {item.highlightedText && (
          <div className="text-xs sm:text-sm text-slate-500 italic mb-2 border-l-2 border-indigo-300 pl-2">
            &quot;{item.highlightedText}&quot;
          </div>
        )}
        <div className="text-sm sm:text-base text-gray-800 leading-relaxed font-sans prose prose-slate max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mt-3 mb-1">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 mt-2 mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1">{children}</h3>,
              p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-gray-800">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-indigo-400 pl-3 italic my-2 text-gray-600 bg-slate-50 py-1 rounded-r">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono font-medium">
                  {children}
                </code>
              ),
            }}
          >
            {item.response}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
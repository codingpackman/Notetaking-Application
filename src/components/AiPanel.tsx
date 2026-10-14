'use client';

import { useAppStore } from '@/store/useAppStore';
import { Trash2, Brain, BookOpen, HelpCircle, FileText } from 'lucide-react';
import { AiHistoryItem } from '@/types';

export default function AiPanel() {
  const aiHistory = useAppStore((state) => state.aiHistory);
  const clearAiHistory = useAppStore((state) => state.clearAiHistory);

  return (
    <div className="flex flex-col h-full bg-white border-l">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Brain size={20} className="text-purple-600" />
          AI Assistant
        </h2>
        {aiHistory.length > 0 && (
          <button
            onClick={clearAiHistory}
            className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
            title="Clear History"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {aiHistory.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p className="text-base">Highlight text in a PDF to get summaries, practice questions, and flashcards.</p>
          </div>
        ) : (
          aiHistory.map((item) => (
            <AiResponseCard key={item.id} item={item} />
          ))
        )}
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
      default:
        return { icon: Brain, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', label: 'AI Response' };
    }
  };

  const config = getTypeConfig(item.type);
  const Icon = config.icon;

  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm ${config.border}`}>
      <div className={`px-3 py-2 border-b flex items-center gap-2 text-base font-medium ${config.bg} ${config.color} ${config.border}`}>
        <Icon size={18} />
        {config.label}
      </div>
      <div className="p-3 bg-white">
        <div className="text-sm text-gray-500 italic mb-2 border-l-2 border-gray-200 pl-2">
          &quot;{item.highlightedText}&quot;
        </div>
        <div className="text-base text-gray-800 whitespace-pre-wrap">
          {item.response}
        </div>
      </div>
      <div className="px-3 py-1.5 bg-gray-50 text-sm text-gray-400 text-right border-t">
        {new Date(item.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
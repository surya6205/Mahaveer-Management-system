import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Truck, Calculator, MessageSquare, ShieldCheck } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'Pune se Surat 24 Ton open body truck ka lagbhag freight rate, diesel cost aur total toll kitna hoga?',
    'Customer ko LR Dispatch aur Vehicle detail Bhejane ke liye WhatsApp message draft karo.',
    'Customer ko Outstanding Balance Freight Payment ke liye polite WhatsApp reminder message draft karo.',
    'GTA Transport GST me Reverse Charge Mechanism (RCM) vs Forward Charge ki simple guide batao.'
  ];

  const handleAskAI = async (queryText?: string) => {
    const textToAsk = queryText || prompt;
    if (!textToAsk.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAsk })
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setResponse(data.result);
      } else {
        setResponse(`Error: ${data.error || 'Failed to query AI Transport Assistant'}`);
      }
    } catch (err: any) {
      setResponse(`Error connecting to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                AI Transport Rates & Route Assistant
              </h3>
              <p className="text-xs text-slate-400">
                Route cost estimates, WhatsApp message drafting & transport GST advice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Preset Query Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">Quick AI Prompts:</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(q);
                    handleAskAI(q);
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs text-left transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* User Input Form */}
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything e.g. Route freight estimation, WhatsApp message for POD update, GTA GST rules..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={() => handleAskAI()}
              disabled={loading || !prompt.trim()}
              className="absolute right-3 bottom-3 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              {loading ? (
                <span>Thinking...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </div>

          {/* Response Box */}
          {response && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-slate-200 space-y-2 whitespace-pre-wrap leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-400 border-b border-slate-700 pb-2">
                <Bot className="h-4 w-4" />
                <span>AI Transport Operations Advisor:</span>
              </div>
              <div className="text-slate-300 font-sans">{response}</div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { Quest, WeatherData } from '../types';

interface AiAdvisorChatProps {
  country?: string;
  weather: WeatherData | null;
  quests: Quest[];
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiAdvisorChat: React.FC<AiAdvisorChatProps> = ({
  country,
  weather,
  quests,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Welcome. I am your DailyQuest Advisor. I am monitoring conditions in ${
        country || 'Japan'
      } (${weather?.temperature ?? 19}°C, ${weather?.condition ?? 'Mainly Clear'}). Ask me anything about your quests or swap a task.`,
      timestamp: 'Initial',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const QUICK_PROMPTS = [
    'Explain the physiological rationale behind Objective #1',
    'How does today’s local weather influence focus?',
    'Suggest a physical substitute if recovering from injury',
    'Tactical advice for overcoming early morning resistance',
  ];

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/quest/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            country: country || 'Japan',
            city: weather?.city,
            temperature: weather?.temperature,
            condition: weather?.condition,
            activeQuests: quests.map((q) => q.title),
          },
        }),
      });

      const data = await res.json();
      const aiReply: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: data.reply || 'Consistency is the primary differentiator. Execute according to plan.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: 'Maintain commitment to your 4 to 5 daily standards. Initiate a focused 25-minute sprint to establish momentum.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full flex flex-col h-[540px] shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-white">
                Executive Performance Advisor
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Circadian & Behavioral Strategy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close advisor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-slate-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs ${
                  m.sender === 'user'
                    ? 'bg-slate-800 text-white font-medium border border-slate-700'
                    : 'bg-slate-950 border border-slate-800 text-slate-300'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                <span className="text-[9px] text-slate-500 font-mono block mt-1.5">
                  {m.timestamp}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-slate-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              <span className="font-mono text-[11px]">Formulating advisory response...</span>
            </div>
          )}
        </div>

        {/* Prompt Suggestions */}
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inquire regarding circadian timing, rationale, or substitutions..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-950 transition-colors"
              aria-label="Send query"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

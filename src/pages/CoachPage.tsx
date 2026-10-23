import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, User } from '../types';
import { api } from '../services/api';

interface CoachPageProps {
  user: User | null;
}

export const CoachPage: React.FC<CoachPageProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Hey ${
        user?.name || 'there'
      }! 👋 I'm your PocketWise AI Finance Coach. I can analyze your recorded expenses, check your budget limits, give tips on cutting impulsive canteen or shopping spends, and help you reach your savings goals. What would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'How can I save ₹1,000 this month?',
    'Which category uses most of my spending?',
    'Am I on track with my monthly budgets?',
    'How do I build an emergency cushion on pocket money?',
    'Explain the 50/30/20 rule for college students.',
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text }],
        }));

      const res = await api.chatWithCoach(userText.trim(), history);
      setIsConfigured(res.isConfigured);

      const coachMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'coach',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reach coach';
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'coach',
          text: `I ran into a connection error: ${msg}. Please verify your network and try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'coach',
        text: `Fresh chat started! Ask me any question about your spending habits, college budget, or savings milestones.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-135px)]">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">PocketWise AI Coach</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Gemini AI
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Personalized guidance grounded in your real recorded transactions & budgets.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          title="Reset conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {!isConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>AI Key Notice:</strong> The `GEMINI_API_KEY` secret is not configured in the environment. Set it in the Secrets panel to activate live model generation.
          </span>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-stone-800 text-white'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-stone-50 text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[10px] mt-1.5 font-medium ${
                    isUser ? 'text-emerald-100 text-right' : 'text-stone-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl text-xs text-stone-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Analyzing your financial summary...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Sample Quick Questions */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
        <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-stone-500 font-medium shrink-0">Try asking:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 hover:border-emerald-400 hover:text-emerald-800 text-xs whitespace-nowrap shadow-xs transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200/90 shadow-xs"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your canteen spend, budgets, or how to save ₹1,000..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      <p className="text-[11px] text-stone-400 text-center">
        PocketWise AI offers educational financial coaching grounded in your recorded data. Not formal investment advice.
      </p>
    </div>
  );
};

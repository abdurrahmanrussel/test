
import React, { useState, useRef, useEffect } from 'react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.1-8b-instant';

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted && !open) openChat(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [open, hasInteracted]);

  const openChat = (isAuto = false) => {
    if (!open) setOpen(true);
    if (messages.length === 0) {
      setMessages([
         {
          role: 'assistant',
          content: "Hi! 👋 I’m AA Trading AI Assistant. How can I help you today?",
        },
      ]);
    }
    if (!isAuto) setHasInteracted(true);
  };

  const closeChat = () => {
    setOpen(false);
    setHasInteracted(true);
  };

  const systemPrompt = `
You are AA Trading AI Assistant — a coding-based trading assistant.

Guidelines:
- Keep responses short, clear, and professional.
- Use bullets when helpful.
- Only answer what the user asks.
- If you don’t know, say you don’t know.

About AA Trading (DUMMY INFO - to be replaced later):
- Company Name: AA Trading
- Website: www.aatrading.com
- Focus: Algorithmic & Indicator-Based Trading
- Products:
  1) Smart Trend Indicator
  2) AI Momentum Strategy
- Services: Trading signals, strategy backtesting, and indicator customization.
- Market: Forex, Crypto, and Stocks
- Support: support@aatrading.com
`;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            userMessage,
          ],
          temperature: 0.4,
        }),
      });

      const data = await res.json();

      if (data?.choices?.[0]?.message) {
        const reply = data.choices[0].message;
        setMessages((prev) => [...prev, reply]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => openChat(false)}
        className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-xl text-gray-900 w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:scale-105 transition-all hover:shadow-2xl"
        title="Chat with AA Trading Assistant"
      >
        💬
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[430px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm">

          {/* Header */}
          <div className="p-3 border-b bg-white text-gray-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-semibold text-lg">AA Trading Assistant</span>
            </div>
            <button
              onClick={closeChat}
              className="text-gray-500 hover:text-red-500 transition-colors"
              title="Close chat"
            >
              ✖
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-sm bg-gray-50">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[85%] break-words transition-all ${
                  msg.role === 'user'
                    ? 'ml-auto bg-black text-white shadow-md'
                    : 'mr-auto bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {loading && (
              <div className="mr-auto bg-white border border-gray-200 p-2 rounded-xl text-xs text-gray-500 italic">
                Typing...
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input Area */}
          <div className="p-2 border-t bg-white flex gap-2 items-center">
            <input
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ask about AA Trading..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />

            <button
              onClick={sendMessage}
              className="px-4 py-2 text-sm bg-black text-white rounded-xl shadow hover:bg-gray-800 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}



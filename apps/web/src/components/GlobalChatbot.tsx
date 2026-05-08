"use client";

import { MessageSquare, X, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { hasStoredSession } from "@/lib/auth";
import { usePathname } from "next/navigation";

export function GlobalChatbot() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: "Hello. I am the Zoro Intelligence Engine. To prove the underlying structural math, you can ask me anything about human metabolism, Indian macros, or how our algorithm works." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setEnabled(hasStoredSession());
  }, [pathname]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    const currentInput = input;
    setInput("");

    try {
      setIsTyping(true);
      const data = await apiFetch("/ai/chat/", {
        method: "POST",
        body: JSON.stringify({ message: currentInput }),
      });

      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.response
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "Connection to Zoro Neural Engine failed. Please ensure the backend server is running."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">

      {/* Search Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl mb-4 overflow-hidden flex flex-col h-[500px]"
        >
          {/* Header */}
          <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-semibold text-zinc-900 text-sm">Zoro AI Advisor</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-[#111] text-white rounded-tr-sm' : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* WhatsApp Style Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm rounded-tl-sm flex items-center gap-1.5 w-16 h-10">
                  <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about calories, macros, or our data..."
              className="flex-1 h-10 px-3 text-sm outline-none bg-zinc-50 rounded-lg border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-zinc-900"
            />
            <button type="submit" className="w-10 h-10 flex items-center justify-center bg-[#111] hover:bg-black text-white rounded-lg transition-colors">
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </motion.div>
      )}

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-colors duration-300 ${isOpen ? 'bg-zinc-800' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}

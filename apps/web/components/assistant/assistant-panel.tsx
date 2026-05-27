"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "model" | "system";
  content: string;
}

export default function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Hello! I am your Pollaris Assistant. Tell me what decision you'd like to orchestrate. For example:\n\n'Create a private poll for the engineering team choosing between GKE and Cloud Run.'",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userPrompt = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: userPrompt }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          agent_type: "creation",
          conversation_id: conversationId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with AI");
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      setMessages((prev) => [...prev, { role: "model", content: data.text }]);

      // If a poll creation was logged in the response (e.g. contains poll creation indicator)
      if (data.text.toLowerCase().includes("created") || data.text.toLowerCase().includes("poll-id")) {
        toast.success("Poll was created! Refreshing your feed.");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Sorry, I encountered an error communicating with the agent server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-50 text-sm">Pollaris AI</h3>
                <span className="text-xs text-indigo-400 font-medium">Orchestration Agent</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-zinc-800 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    msg.role === "user"
                      ? "bg-zinc-800 text-zinc-300"
                      : "bg-indigo-950 text-indigo-400 border border-indigo-900"
                  }`}
                >
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`px-3 py-2 rounded-xl max-w-[80%] whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-900 flex items-center justify-center text-xs shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-2 rounded-xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me to draft a poll..."
              disabled={isLoading}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 placeholder-zinc-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2 rounded-xl transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-500/20 hover:scale-105 transition-all duration-200 border border-indigo-400/20"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}

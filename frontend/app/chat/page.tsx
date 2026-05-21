"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { chatAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send, Mic, MicOff, Plus, Trash2, MessageSquare,
  Sprout, Volume2, VolumeX, ChevronDown, Globe
} from "lucide-react";
import { cn, LANGUAGES, getInitials, formatTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Session {
  _id: string;
  title: string;
  updated_at: string;
  language: string;
}

const SUGGESTED_QUERIES = [
  "Why are my tomato leaves turning yellow?",
  "Best fertilizer for wheat crop?",
  "How to control pests organically?",
  "Which crop is best for black soil in Kharif?",
  "How to apply for PM-KISAN scheme?",
  "What is the best time to irrigate cotton?",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
        <Sprout className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="typing-dot w-2 h-2 rounded-full bg-primary-500" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, userName }: { message: Message; userName: string }) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if ("speechSynthesis" in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-end gap-2 group", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
        isUser
          ? "bg-gradient-to-br from-slate-600 to-slate-800 text-white"
          : "bg-gradient-to-br from-primary-500 to-primary-700 text-white"
      )}>
        {isUser ? getInitials(userName) : <Sprout className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[75%] sm:max-w-[65%]", isUser ? "items-end" : "items-start", "flex flex-col gap-1")}>
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-sm"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm"
        )}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose-farmer">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className={cn("flex items-center gap-2 px-1", isUser && "flex-row-reverse")}>
          <span className="text-xs text-slate-400">{formatTime(message.timestamp)}</span>
          {!isUser && (
            <button onClick={speak} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary-500">
              {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // Default to English — user can switch via dropdown. Do NOT auto-set from profile.
  const [language, setLanguage] = useState("en");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await chatAPI.getSessions();
      setSessions(res.data.sessions || []);
    } catch { }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const res = await chatAPI.getSession(sessionId);
      setCurrentSession(sessionId);
      setMessages(res.data.messages || []);
      setLanguage(res.data.language || "en");
      setSidebarOpen(false);
    } catch {
      toast.error("Failed to load conversation");
    }
  };

  const newChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (currentSession === sessionId) newChat();
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage({
        message: messageText,
        session_id: currentSession || undefined,
        language,
      });

      const { session_id, message } = response.data;
      if (!currentSession) {
        setCurrentSession(session_id);
        loadSessions();
      }

      const aiMessage: Message = {
        role: "assistant",
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => { setIsListening(false); toast.error("Voice input failed"); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || true) && (
            <motion.div
              initial={false}
              className={cn(
                "flex-shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950",
                "hidden lg:flex w-64"
              )}
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <Button onClick={newChat} variant="outline" className="w-full" leftIcon={<Plus className="w-4 h-4" />} size="sm">
                  New Chat
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No conversations yet</div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session._id}
                      onClick={() => loadSession(session._id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group flex items-center gap-2",
                        currentSession === session._id
                          ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
                      <span className="flex-1 truncate">{session.title}</span>
                      <button
                        onClick={(e) => deleteSession(session._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">KrishiMitra AI Copilot</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Online · Powered by Gemini AI</span>
                </div>
              </div>
            </div>
            {/* Language selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-2xl shadow-primary-500/30"
                >
                  <Sprout className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Namaste! I'm KrishiMitra 🌾
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-8">
                  Your AI farming advisor. Ask me anything about crops, weather, diseases, market prices, or government schemes.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_QUERIES.map((query) => (
                    <motion.button
                      key={query}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendMessage(query)}
                      className="text-left px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:border-primary-300 dark:hover:border-primary-700 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-all"
                    >
                      {query}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} userName={user?.name || "You"} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask KrishiMitra anything... (${language === "hi" ? "हिंदी में पूछें" : language === "kn" ? "ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ" : "Ask in English"})`}
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none px-2 py-1.5 max-h-32"
                style={{ minHeight: "36px" }}
              />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={isListening ? stopVoice : startVoice}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="p-2 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Press Enter to send · Shift+Enter for new line · 🎤 Voice input supported
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

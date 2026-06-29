"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, ShoppingCart, Trash2 } from "lucide-react";
import ProductCard from "./ProductCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ChatWidget({ catalog = [], cart = [], onCartUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sId = localStorage.getItem("luminara_session_id");
    if (!sId) {
      sId = "session_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("luminara_session_id", sId);
    }
    Promise.resolve().then(() => {
      setSessionId(sId);
      setIsMounted(true);
    });
  }, []);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const append = async (userMsg) => {
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      let assistantMsg = { role: "assistant", content: "", id: Date.now().toString() };
      setMessages((prev) => [...prev, assistantMsg]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantMsg.content += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...assistantMsg };
          return updated;
        });
      }

      const cartUpdated = response.headers.get("x-cart-updated");
      if (cartUpdated && onCartUpdate) {
        try {
          onCartUpdate(JSON.parse(cartUpdated));
        } catch (e) {
          console.error("Failed to parse cart header:", e);
        }
      }
    } catch (error) {
      console.error("Chat streaming error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    append({ role: "user", content: input, id: Date.now().toString() });
    setInput("");
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Listen for custom open-chat event from other components
  useEffect(() => {
    const handleOpenChat = (e) => {
      const message = e.detail;
      if (message) {
        setIsOpen(true);
        // Small delay to let the widget open before submitting
        setTimeout(() => {
          setInput(message);
          // Manually trigger the form submit logic using a custom event that we listen to, or by clicking a hidden button.
          setTimeout(() => {
            const submitBtn = document.getElementById('chat-submit-btn');
            if (submitBtn) submitBtn.click();
          }, 100);
        }, 300);
      }
    };

    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, []);

  // Handle direct "Add to Cart" inside the chat card
  const handleAddToCart = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success && onCartUpdate) {
        onCartUpdate(data.cart);
      }
    } catch (err) {
      console.error("Error adding to cart from chat:", err);
    }
  };

  // Parse assistant response to render ProductCard inline
  const renderMessageContent = (content) => {
    const regex = /\[ProductCard:\s*([0-9a-fA-F]{24})\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          value: content.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: "card",
        value: match[1],
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        value: content.substring(lastIndex),
      });
    }

    if (parts.length === 0) {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
    }

    return (
      <div className="space-y-3">
        {parts.map((part, idx) => {
          if (part.type === "text") {
            return (
              <p key={idx} className="text-sm leading-relaxed whitespace-pre-wrap">
                {part.value}
              </p>
            );
          } else {
            const product = catalog.find((p) => p._id === part.value);
            if (product) {
              return (
                <div key={idx} className="my-2">
                  <ProductCard
                    product={product}
                    isMini={true}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              );
            }
            return null;
          }
        })}
      </div>
    );
  };

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-[calc(100vw-32px)] sm:w-[380px] h-[550px] mb-4 rounded-2xl glass shadow-2xl flex flex-col overflow-hidden border border-white/40"
          >
            {/* Chat Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-100" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm leading-none">Luminara AI Concierge</h3>
                  <span className="text-[10px] text-stone-300">Online & Ready to assist</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-serif font-bold text-stone-900">How can I help you today?</h4>
                  <p className="text-xs text-stone-500 max-w-[240px]">
                    Ask me about our organic skincare products, custom routines, or sensitive skin bundles!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {[
                      "Best sunscreen for sensitive skin?",
                      "Recommend a skincare routine",
                      "Show me the Essentials Bundle"
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(suggestion);
                        }}
                        className="text-[10.5px] bg-white border border-stone-200 hover:border-primary/50 text-stone-700 py-1.5 px-3 rounded-full transition-all cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-white rounded-br-none shadow-sm"
                        : "bg-stone-100 text-stone-850 rounded-bl-none border border-stone-200/40"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p>{message.content}</p>
                    ) : (
                      renderMessageContent(message.content)
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-stone-100 rounded-2xl rounded-bl-none px-4 py-3 border border-stone-200/40">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <form id="chat-widget-form" onSubmit={handleSubmit} className="p-3 border-t border-stone-200/60 bg-white/50 flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Luminara Concierge..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-primary/50 text-stone-850"
              />
              <button
                id="chat-submit-btn"
                type="submit"
                disabled={!(input || "").trim() || isLoading}
                className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:bg-stone-800 transition-all border border-white/20 relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small badge showing active items in cart */}
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-pulse">
            {cart.reduce((total, item) => total + item.quantity, 0)}
          </span>
        )}
      </motion.button>
    </div>
  );
}

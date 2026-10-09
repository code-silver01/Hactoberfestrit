import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "../types/circuit";
import { chatFollowup } from "../services/api";

interface Props {
  sessionId: string;
}

export function ChatPanel({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I've analyzed your circuit. Ask me anything — about specific components, wiring, or how to fix the issues I found. I still have the full circuit and diagnosis in context.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await chatFollowup(input.trim(), sessionId, [
        ...messages,
        userMsg,
      ]);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I couldn't process that. ${err instanceof Error ? err.message : "Please try again."}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel" id="chat-panel">
      <div className="card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="card-title">💬 Ask the Circuit</span>
        <span className="text-xs text-muted">Context preserved</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble assistant" style={{ opacity: 0.6 }}>
            <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2, display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
            Thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          className="input"
          placeholder="Ask about your circuit…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          id="chat-input"
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          id="chat-send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
}

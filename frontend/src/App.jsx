import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const BACKEND = "http://127.0.0.1:5000";

function SourceBadge({ source, page }) {
  const name = source.split("/").pop().replace(".pdf", "");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: "#f5f0e8", border: "1px solid #d4c4a0",
      borderRadius: "4px", padding: "2px 8px",
      fontSize: "11px", color: "#7a5c2e", fontFamily: "'JetBrains Mono', monospace",
      marginRight: "6px", marginTop: "4px"
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      {name} · p.{page}
    </span>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "24px",
      gap: "12px",
      alignItems: "flex-start"
    }}>
      {!isUser && (
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: "linear-gradient(135deg, #8b6914, #c4922a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: "2px",
          boxShadow: "0 2px 8px rgba(139,105,20,0.3)"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
      )}
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #2c1810, #4a2c1a)"
            : "#faf7f2",
          border: isUser ? "none" : "1px solid #e8dfc8",
          borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
          padding: "14px 18px",
          color: isUser ? "#f5ead8" : "#2c2416",
          fontSize: "14.5px",
          lineHeight: "1.75",
          boxShadow: isUser
            ? "0 4px 16px rgba(44,24,16,0.25)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          fontFamily: isUser ? "'JetBrains Mono', monospace" : "'Crimson Pro', Georgia, serif",
          letterSpacing: isUser ? "0.01em" : "0"
        }}>
          {isUser ? (
            <span>› {msg.content}</span>
          ) : (
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#1a1208", marginBottom: "10px", marginTop: "4px", fontFamily: "'Crimson Pro', serif" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#8b6914", marginBottom: "8px", marginTop: "16px", fontFamily: "'Crimson Pro', serif" }}>{children}</h2>,
                p: ({ children }) => <p style={{ marginBottom: "10px", marginTop: 0 }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: "20px", marginBottom: "10px" }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: "4px" }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: "#1a1208", fontWeight: "700" }}>{children}</strong>,
                code: ({ children }) => <code style={{ background: "#ede8dc", padding: "1px 5px", borderRadius: "3px", fontSize: "12px", fontFamily: "monospace", color: "#7a5c2e" }}>{children}</code>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap" }}>
            {msg.sources.map((s, i) => <SourceBadge key={i} source={s.source} page={s.page} />)}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: "#2c1810",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: "2px"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5ead8" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        background: "linear-gradient(135deg, #8b6914, #c4922a)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <div style={{
        background: "#faf7f2", border: "1px solid #e8dfc8",
        borderRadius: "4px 18px 18px 18px",
        padding: "16px 20px", display: "flex", gap: "6px", alignItems: "center"
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#c4922a",
            animation: "pulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome. Upload your documents to begin querying the knowledge base. I can answer questions, compare concepts, and trace every answer back to its source.",
      sources: []
    }
  ]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [stats, setStats] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const uploadFiles = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND}/upload`, formData);
      setUploaded(true);
      setStats(res.data.stats);
      setMessages([{
        role: "assistant",
        content: `Knowledge base ready. Indexed **${res.data.stats?.pages || "?"} pages** across **${res.data.stats?.chunks || "?"} chunks**. What would you like to know?`,
        sources: []
      }]);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Is the backend running at localhost:5000?");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const q = input.trim();
    if (!q) return;
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/chat`, { question: q });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources || []
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Could not reach the backend. Please ensure the Flask server is running.",
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (dropped.length) setFiles(dropped);
  };

  const clearChat = async () => {
    try {
      await axios.post(`${BACKEND}/reset`);
    } catch {
      // backend reset failed silently — UI still clears
    }
    setMessages([{
      role: "assistant",
      content: "Chat cleared. Your documents are still indexed — ask away.",
      sources: []
    }]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0ebe0; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4c4a0; border-radius: 3px; }
        textarea:focus, button:focus { outline: none; }
        .upload-zone { transition: all 0.2s ease; }
        .upload-zone:hover { border-color: #c4922a !important; background: #fdf9f2 !important; }
        .send-btn:hover { background: #8b6914 !important; }
        .send-btn:active { transform: scale(0.96); }
        .upload-btn:hover { background: #7a5c2e !important; color: #fdf9f2 !important; }
      `}</style>

      <div style={{
        display: "flex", height: "100vh", fontFamily: "'Crimson Pro', Georgia, serif",
        background: "#f0ebe0"
      }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          width: "280px", flexShrink: 0,
          background: "#1e140a",
          display: "flex", flexDirection: "column",
          padding: "0",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)"
        }}>

          {/* Logo */}
          <div style={{
            padding: "28px 24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "6px",
                background: "linear-gradient(135deg, #8b6914, #c4922a)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ color: "#f5ead8", fontSize: "15px", fontWeight: "600", letterSpacing: "0.02em" }}>DocMind</div>
                <div style={{ color: "#8b7355", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>RAG · v2.0</div>
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: "#8b7355", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "12px" }}>
              DOCUMENT CORPUS
            </div>

            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                border: `1.5px dashed ${dragOver ? "#c4922a" : "#4a3520"}`,
                borderRadius: "8px",
                padding: "20px 12px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(196,146,42,0.08)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
                marginBottom: "12px"
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={e => setFiles(Array.from(e.target.files))}
                style={{ display: "none" }}
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <div style={{ color: "#a08060", fontSize: "12px", lineHeight: "1.5" }}>
                {files.length > 0
                  ? files.map(f => f.name).join(", ")
                  : "Drop PDFs here or click to browse"}
              </div>
            </div>

            <button
              className="upload-btn"
              onClick={uploadFiles}
              disabled={loading || files.length === 0}
              style={{
                width: "100%",
                padding: "10px",
                background: files.length > 0 ? "#c4922a" : "#2a1f14",
                color: files.length > 0 ? "#1a0f04" : "#4a3520",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "500",
                cursor: files.length > 0 ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                letterSpacing: "0.05em"
              }}
            >
              {loading && !uploaded ? "INDEXING..." : "INDEX DOCUMENTS"}
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "#8b7355", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "12px" }}>
                INDEX STATS
              </div>
              {[
                { label: "Pages", value: stats.pages, icon: "📄" },
                { label: "Chunks", value: stats.chunks, icon: "🧩" },
              ].map(s => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <span style={{ color: "#6b5540", fontSize: "12px" }}>{s.label}</span>
                  <span style={{
                    color: "#c4922a", fontSize: "12px",
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: "500"
                  }}>{s.value}</span>
                </div>
              ))}
              <div style={{
                marginTop: "12px", padding: "8px 10px",
                background: "rgba(196,146,42,0.1)", borderRadius: "5px",
                border: "1px solid rgba(196,146,42,0.2)"
              }}>
                <div style={{ color: "#c4922a", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}>
                  ● READY
                </div>
              </div>
            </div>
          )}

          {/* Pipeline info */}
          <div style={{ padding: "16px", marginTop: "auto" }}>
            <div style={{ color: "#4a3520", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", marginBottom: "10px" }}>
              PIPELINE
            </div>
            {[
              "Hybrid Dense + BM25",
              "RRF Score Fusion",
              "Cross-Encoder Rerank",
              "Parent Reconstruction",
              "LLM w/ Citations"
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "6px",
                marginBottom: "6px"
              }}>
                <div style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: uploaded ? "#c4922a" : "#3a2a1a", flexShrink: 0
                }} />
                <span style={{ color: uploaded ? "#6b5540" : "#3a2a1a", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MAIN AREA ── */}
        <main style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: "#f5f0e8",
          minWidth: 0
        }}>

          {/* Header */}
          <header style={{
            height: "56px", borderBottom: "1px solid #ddd4bc",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 32px",
            background: "#faf7f2"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#8b7355", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}>
                {uploaded
                  ? `${files.map(f => f.name.replace(".pdf","")).join(", ")}`
                  : "No documents loaded"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {uploaded && messages.length > 1 && (
                <button
                  onClick={clearChat}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "transparent",
                    border: "1px solid #d4c4a0",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    cursor: "pointer",
                    color: "#8b7355",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f5ead8"; e.currentTarget.style.borderColor = "#c4922a"; e.currentTarget.style.color = "#7a5c2e"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#d4c4a0"; e.currentTarget.style.color = "#8b7355"; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                  </svg>
                  CLEAR CHAT
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: uploaded ? "#5a9a2a" : "#c4922a",
                  boxShadow: uploaded ? "0 0 6px rgba(90,154,42,0.5)" : "0 0 6px rgba(196,146,42,0.5)"
                }} />
                <span style={{ color: "#8b7355", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}>
                  {uploaded ? "INDEXED" : "AWAITING DOCS"}
                </span>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "32px 48px",
            display: "flex", flexDirection: "column"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ animation: "fadeSlideIn 0.3s ease" }}>
                <Message msg={msg} />
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "16px 48px 24px",
            background: "linear-gradient(to top, #f5f0e8 80%, transparent)",
          }}>
            <div style={{
              background: "#faf7f2",
              border: "1.5px solid #d4c4a0",
              borderRadius: "12px",
              display: "flex", alignItems: "flex-end", gap: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              transition: "border-color 0.2s"
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={uploaded ? "Ask anything about your documents..." : "Upload documents first to begin querying..."}
                disabled={!uploaded || loading}
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  resize: "none", fontSize: "15px",
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  color: "#2c2416", lineHeight: "1.6",
                  maxHeight: "120px", overflowY: "auto",
                  opacity: !uploaded ? 0.5 : 1
                }}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || loading || !uploaded}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: input.trim() && uploaded ? "#c4922a" : "#e8dfc8",
                  border: "none", cursor: input.trim() && uploaded ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.2s"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={input.trim() && uploaded ? "white" : "#a08060"} strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{
              textAlign: "center", marginTop: "8px",
              color: "#b0a080", fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              Enter to send · Shift+Enter for new line · Answers grounded in your documents
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const BACKEND = "http://127.0.0.1:5000";

const C = {
  bg:        "#070b0f",
  panel:     "#0c1117",
  border:    "#1a2535",
  borderGlow:"#00d4ff",
  accent:    "#00d4ff",
  accentDim: "#0a4a5c",
  green:     "#00ff88",
  greenDim:  "#003322",
  purple:    "#7c3aed",
  text:      "#c8d8e8",
  textDim:   "#4a6070",
  textBright:"#eef4fa",
  userBg:    "#0d1f2d",
  aiBg:      "#0a0f14",
};

function SourceBadge({ source, page }) {
  const name = source.split("/").pop().replace(".pdf", "").toUpperCase();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: "rgba(0,212,255,0.05)",
      border: `1px solid rgba(0,212,255,0.25)`,
      borderRadius: "3px", padding: "2px 8px",
      fontSize: "10px", color: C.accent,
      fontFamily: "'JetBrains Mono', monospace",
      marginRight: "6px", marginTop: "4px",
      letterSpacing: "0.05em"
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      {name} · P{page}
    </span>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "20px",
      gap: "10px",
      alignItems: "flex-start",
      animation: "fadeUp 0.25s ease"
    }}>
      {!isUser && (
        <div style={{
          width: "30px", height: "30px", borderRadius: "6px", flexShrink: 0,
          background: "linear-gradient(135deg, #003344, #006688)",
          border: `1px solid ${C.accent}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 12px rgba(0,212,255,0.3)`, marginTop: "2px"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
      )}

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser ? C.userBg : C.aiBg,
          border: isUser
            ? `1px solid rgba(0,212,255,0.2)`
            : `1px solid ${C.border}`,
          borderRadius: isUser ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
          padding: "12px 16px",
          color: C.text,
          fontSize: "14px",
          lineHeight: "1.7",
          fontFamily: isUser ? "'JetBrains Mono', monospace" : "'Inter', system-ui, sans-serif",
          boxShadow: isUser
            ? `0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`
            : `0 2px 12px rgba(0,0,0,0.4)`,
          position: "relative"
        }}>
          {isUser ? (
            <span style={{ color: C.textBright, fontSize: "13px" }}>
              <span style={{ color: C.accent, marginRight: "6px" }}>›</span>
              {msg.content}
            </span>
          ) : (
            <ReactMarkdown components={{
              h1: ({ children }) => <h1 style={{ fontSize: "16px", fontWeight: "700", color: C.textBright, marginBottom: "10px", marginTop: "4px" }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: "14px", fontWeight: "600", color: C.accent, marginBottom: "8px", marginTop: "14px", letterSpacing: "0.03em" }}>{children}</h2>,
              p: ({ children }) => <p style={{ marginBottom: "8px", marginTop: 0 }}>{children}</p>,
              ul: ({ children }) => <ul style={{ paddingLeft: "18px", marginBottom: "8px" }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ paddingLeft: "18px", marginBottom: "8px" }}>{children}</ol>,
              li: ({ children }) => <li style={{ marginBottom: "4px", color: C.text }}>{children}</li>,
              strong: ({ children }) => <strong style={{ color: C.textBright, fontWeight: "600" }}>{children}</strong>,
              code: ({ children }) => <code style={{ background: "rgba(0,212,255,0.08)", color: C.accent, padding: "1px 5px", borderRadius: "3px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", border: "1px solid rgba(0,212,255,0.15)" }}>{children}</code>,
            }}>
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap" }}>
            {msg.sources.map((s, i) => <SourceBadge key={i} source={s.source} page={s.page} />)}
          </div>
        )}
      </div>

      {isUser && (
        <div style={{
          width: "30px", height: "30px", borderRadius: "6px", flexShrink: 0,
          background: "#0d1f2d",
          border: `1px solid rgba(0,212,255,0.2)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: "2px"
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2">
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
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "flex-start" }}>
      <div style={{
        width: "30px", height: "30px", borderRadius: "6px", flexShrink: 0,
        background: "linear-gradient(135deg, #003344, #006688)",
        border: `1px solid ${C.accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 12px rgba(0,212,255,0.3)`
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      </div>
      <div style={{
        background: C.aiBg, border: `1px solid ${C.border}`,
        borderRadius: "2px 12px 12px 12px",
        padding: "14px 18px", display: "flex", gap: "5px", alignItems: "center"
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: C.accent,
            animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`
          }}/>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "System online. Upload PDF documents to initialize the knowledge base. All answers are grounded in your documents with source citations.",
    sources: []
  }]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [stats, setStats] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const uploadFiles = async () => {
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND}/upload`, formData);
      setUploaded(true);
      setStats(res.data.stats);
      setMessages([{
        role: "assistant",
        content: `Knowledge base initialized. **${res.data.stats?.pages || "?"} pages** indexed across **${res.data.stats?.chunks || "?"} chunks**. Ready for queries.`,
        sources: []
      }]);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Ensure backend is running at localhost:5000");
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
        content: "Connection error. Verify the Flask backend is running.",
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try { await axios.post(`${BACKEND}/reset`); } catch {}
    setMessages([{
      role: "assistant",
      content: "Session cleared. Documents remain indexed.",
      sources: []
    }]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (dropped.length) setFiles(dropped);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; overflow: hidden; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity:0.2; transform:scale(0.8); }
          50%      { opacity:1;   transform:scale(1.1); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(0,212,255,0.3); }
          50%      { box-shadow: 0 0 20px rgba(0,212,255,0.6); }
        }
        @keyframes border-flow {
          0%   { border-color: rgba(0,212,255,0.15); }
          50%  { border-color: rgba(0,212,255,0.45); }
          100% { border-color: rgba(0,212,255,0.15); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a3040; border-radius: 2px; }
        textarea { outline: none; }
        button { cursor: pointer; }

        .upload-zone:hover {
          border-color: rgba(0,212,255,0.5) !important;
          background: rgba(0,212,255,0.04) !important;
        }
        .index-btn:not(:disabled):hover {
          background: rgba(0,212,255,0.15) !important;
          box-shadow: 0 0 20px rgba(0,212,255,0.25) !important;
        }
        .send-btn:not(:disabled):hover {
          background: rgba(0,212,255,0.2) !important;
          box-shadow: 0 0 16px rgba(0,212,255,0.4) !important;
        }
        .clear-btn:hover {
          border-color: rgba(0,212,255,0.4) !important;
          color: ${C.accent} !important;
          background: rgba(0,212,255,0.05) !important;
        }
        .input-wrap:focus-within {
          border-color: rgba(0,212,255,0.4) !important;
          box-shadow: 0 0 20px rgba(0,212,255,0.08) !important;
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: C.bg, position: "relative", overflow: "hidden" }}>

        {/* Scanline effect */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none", zIndex: 100
        }}/>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: "260px", flexShrink: 0,
          background: C.panel,
          borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden"
        }}>
          {/* Top glow line */}
          <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, opacity: 0.6 }}/>

          {/* Logo */}
          <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: "linear-gradient(135deg, #003a4d, #006688)",
                border: `1px solid ${C.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 16px rgba(0,212,255,0.3)`,
                animation: "glow-pulse 3s ease-in-out infinite"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ color: C.textBright, fontSize: "15px", fontWeight: "600", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>DocMind</div>
                <div style={{ color: C.textDim, fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>RAG · v2.0</div>
              </div>
            </div>
          </div>

          {/* Upload */}
          <div style={{ padding: "16px 14px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ color: C.textDim, fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "10px" }}>
              // DOCUMENT CORPUS
            </div>

            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                border: `1px dashed ${dragOver ? C.accent : "rgba(0,212,255,0.2)"}`,
                borderRadius: "6px", padding: "16px 10px", textAlign: "center",
                cursor: "pointer", marginBottom: "10px",
                background: dragOver ? "rgba(0,212,255,0.05)" : "rgba(0,212,255,0.01)",
                transition: "all 0.2s", animation: "border-flow 3s ease-in-out infinite"
              }}
            >
              <input ref={fileInputRef} type="file" multiple accept=".pdf"
                onChange={e => setFiles(Array.from(e.target.files))}
                style={{ display: "none" }} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={files.length ? C.accent : C.textDim} strokeWidth="1.5" style={{ marginBottom: "6px" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <div style={{ color: files.length ? C.accent : C.textDim, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>
                {files.length
                  ? files.map(f => f.name).join(", ")
                  : "drop PDFs / click to browse"}
              </div>
            </div>

            <button
              className="index-btn"
              onClick={uploadFiles}
              disabled={loading || !files.length}
              style={{
                width: "100%", padding: "9px",
                background: files.length ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                color: files.length ? C.accent : C.textDim,
                border: `1px solid ${files.length ? "rgba(0,212,255,0.35)" : C.border}`,
                borderRadius: "5px", fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "500", letterSpacing: "0.08em",
                transition: "all 0.2s", cursor: files.length ? "pointer" : "not-allowed"
              }}
            >
              {loading && !uploaded ? "[ INDEXING... ]" : "[ INDEX DOCUMENTS ]"}
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ padding: "14px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ color: C.textDim, fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "10px" }}>
                // INDEX STATS
              </div>
              {[["pages", stats.pages], ["chunks", stats.chunks]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: C.textDim, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}>{k}</span>
                  <span style={{ color: C.accent, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: "600" }}>{v}</span>
                </div>
              ))}
              <div style={{
                marginTop: "10px", padding: "6px 10px", borderRadius: "4px",
                background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)"
              }}>
                <span style={{ color: C.green, fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }}>
                  ● READY
                </span>
              </div>
            </div>
          )}

          {/* Pipeline */}
          <div style={{ padding: "14px", marginTop: "auto" }}>
            <div style={{ color: C.textDim, fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "10px" }}>
              // PIPELINE
            </div>
            {[
              "Hybrid Dense + BM25",
              "RRF Score Fusion",
              "Cross-Encoder Rerank",
              "Parent Reconstruction",
              "LLM w/ Citations"
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px" }}>
                <div style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: uploaded ? C.accent : C.border,
                  boxShadow: uploaded ? `0 0 6px ${C.accent}` : "none",
                  flexShrink: 0, transition: "all 0.5s"
                }}/>
                <span style={{ color: uploaded ? C.textDim : "#1e2d3a", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", transition: "color 0.5s" }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom glow */}
          <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, opacity: 0.3 }}/>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minWidth: 0 }}>

          {/* Header */}
          <header style={{
            height: "52px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 28px",
            background: "rgba(12,17,23,0.9)",
            backdropFilter: "blur(8px)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: C.accent, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.5 }}>›</span>
              <span style={{ color: C.textDim, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}>
                {uploaded
                  ? files.map(f => f.name.replace(".pdf","").toUpperCase()).join(" + ")
                  : "NO DOCUMENTS LOADED"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {uploaded && messages.length > 1 && (
                <button
                  className="clear-btn"
                  onClick={clearChat}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    borderRadius: "4px", padding: "4px 10px",
                    color: C.textDim, fontSize: "10px",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.06em", transition: "all 0.2s"
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                  </svg>
                  CLEAR
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: uploaded ? C.green : "#ff6b35",
                  boxShadow: uploaded ? `0 0 8px ${C.green}` : "0 0 8px #ff6b35",
                  animation: "glow-pulse 2s ease-in-out infinite"
                }}/>
                <span style={{ color: C.textDim, fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
                  {uploaded ? "INDEXED" : "AWAITING DOCS"}
                </span>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "28px 36px",
            background: `radial-gradient(ellipse at 20% 50%, rgba(0,50,80,0.08) 0%, transparent 60%),
                         radial-gradient(ellipse at 80% 20%, rgba(0,30,60,0.06) 0%, transparent 50%)`
          }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "14px 36px 20px", borderTop: `1px solid ${C.border}`, background: "rgba(7,11,15,0.95)" }}>
            <div
              className="input-wrap"
              style={{
                display: "flex", alignItems: "flex-end", gap: "10px",
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: "8px", padding: "10px 14px",
                transition: "all 0.2s"
              }}
            >
              <span style={{ color: C.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", paddingBottom: "1px", opacity: 0.7 }}>›</span>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                placeholder={uploaded ? "Query the knowledge base..." : "Upload documents to begin..."}
                disabled={!uploaded || loading}
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", resize: "none",
                  fontSize: "14px", fontFamily: "'JetBrains Mono', monospace",
                  color: C.textBright, lineHeight: "1.6",
                  maxHeight: "100px", overflowY: "auto",
                  opacity: !uploaded ? 0.3 : 1,
                  caretColor: C.accent
                }}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || loading || !uploaded}
                style={{
                  width: "32px", height: "32px", borderRadius: "6px", flexShrink: 0,
                  background: input.trim() && uploaded ? "rgba(0,212,255,0.1)" : "transparent",
                  border: `1px solid ${input.trim() && uploaded ? "rgba(0,212,255,0.35)" : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                  cursor: input.trim() && uploaded ? "pointer" : "not-allowed"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={input.trim() && uploaded ? C.accent : C.textDim} strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: "6px", color: C.textDim, fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
              enter to send · shift+enter for newline · answers grounded in your documents
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
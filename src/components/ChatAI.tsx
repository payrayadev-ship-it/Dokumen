import React, { useState, useEffect, useRef } from "react";
import { Project, Document, UserRole } from "../types";
import { 
  Sparkles, MessageSquare, Send, Trash2, Bot, User, CornerDownRight, 
  HelpCircle, AlertCircle, FileText, CheckCircle2, ChevronRight, BookOpen
} from "lucide-react";

interface ChatAIProps {
  projects: Project[];
  documents: Document[];
  currentUserRole: UserRole;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isMock?: boolean;
}

const QUICK_PROMPTS_GENERAL = [
  "Apa standardisasi klausul jaminan kualitas dalam kontrak bisnis?",
  "Bagaimana cara membuat SOP yang tahan terhadap risiko kepatuhan?",
  "Apa ciri-ciri klausul draf addendum yang merugikan salah satu pihak?",
  "Bagaimana skema pengenaan denda wanprestasi yang adil secara hukum?"
];

const QUICK_PROMPTS_CONTRACT = [
  "Ringkas pasal denda harian dan sanksi keterlambatan dokumen ini.",
  "Apakah dokumen ini memuat klausul penahanan pembayaran (retensi)? Jelaskan.",
  "Analisis potensi risiko finansial yang terdapat pada poin kerja ini.",
  "Apakah ada indikasi ketidakseimbangan hak dan kewajiban di naskah ini?"
];

const QUICK_PROMPTS_SOP = [
  "Ringkas keseluruhan langkah prosedur kerja dalam dokumen ini.",
  "Adakah lubang keamanan atau kelemahan kepatuhan operasional di sini?",
  "Sebutkan siapa saja penanggung jawab utama dalam prosedur operasional ini.",
  "Bagaimana langkah eskalasi dalam draf apabila terjadi insiden darurat?"
];

export default function ChatAI({ projects, documents, currentUserRole }: ChatAIProps) {
  // Filters & State
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedDocId, setSelectedDocId] = useState<string>("none");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Autocomplete context binding states
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestQuery, setSuggestQuery] = useState<string>("");
  const [suggestTriggerIndex, setSuggestTriggerIndex] = useState<number>(-1);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Click outside listener for suggestions menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize and load chat history from localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem("doc_compare_chat_history");
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Error parsing saved chat history:", e);
      }
    } else {
      // Welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Halo! Saya adalah **DocCompare AI Assistant**. \n\nSaya siap membantu Anda meninjau dokumen legal, klausul kontrak, laporan anggaran, atau standar operasional prosedur (SOP).\n\nSilakan pilih dokumen acuan di atas untuk memberikan konteks khusus, atau mulailah bertanya hal-hal umum secara langsung!",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Save chat history to localStorage
  const saveChatHistory = (msgs: Message[]) => {
    setMessages(msgs);
    localStorage.setItem("doc_compare_chat_history", JSON.stringify(msgs));
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle selected project changes (reset doc selection if not valid under that project)
  const filteredDocuments = documents.filter(doc => 
    selectedProjectId === "all" || doc.projectId === selectedProjectId
  );

  const selectedDocument = documents.find(d => d.id === selectedDocId);

  // Match documents for autocomplete suggestion list
  const matchingDocuments = documents.filter(doc => {
    if (!suggestQuery) return true;
    return doc.name.toLowerCase().includes(suggestQuery.toLowerCase()) || 
           doc.category.toLowerCase().includes(suggestQuery.toLowerCase());
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1 && lastAtIndex >= textBeforeCursor.lastIndexOf(" ")) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      setSuggestQuery(query);
      setShowSuggestions(true);
      setSuggestTriggerIndex(lastAtIndex);
      setActiveSuggestIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectDocumentFromSuggest = (doc: Document) => {
    if (!inputRef.current) return;
    
    const value = inputMessage;
    const start = suggestTriggerIndex;
    const selectionStart = inputRef.current.selectionStart || 0;
    
    // Replace the '@query' with '@[DocName] '
    const before = value.substring(0, start);
    const after = value.substring(selectionStart);
    
    const insertedName = `@[${doc.name}] `;
    const newValue = before + insertedName + after;
    
    setInputMessage(newValue);
    setSelectedDocId(doc.id);
    setSelectedProjectId(doc.projectId); // Sync workspace project context
    
    setShowSuggestions(false);
    
    // Focus back on input and move cursor after the inserted text
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = start + insertedName.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && matchingDocuments.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestIndex((prev) => (prev + 1) % matchingDocuments.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestIndex((prev) => (prev - 1 + matchingDocuments.length) % matchingDocuments.length);
      } else if (e.key === "Enter") {
         e.preventDefault();
         selectDocumentFromSuggest(matchingDocuments[activeSuggestIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  // Pick Quick Prompts based on selected doc context
  const getQuickPrompts = () => {
    if (selectedDocId === "none" || !selectedDocument) {
      return QUICK_PROMPTS_GENERAL;
    }
    const category = selectedDocument.category.toLowerCase();
    if (category.includes("kontrak") || category.includes("addendum") || category.includes("tender")) {
      return QUICK_PROMPTS_CONTRACT;
    }
    if (category.includes("sop") || category.includes("prosedur")) {
      return QUICK_PROMPTS_SOP;
    }
    return QUICK_PROMPTS_CONTRACT; // fallback
  };

  // Safe Text Formatter (Custom lightweight Markdown renderer)
  const renderFormattedMessage = (text: string) => {
    const lines = text.split("\n");
    let inList = false;
    let listItems: React.ReactNode[] = [];
    const elements: React.ReactNode[] = [];

    const parseInlineStyles = (lineStr: string) => {
      // Bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(lineStr)) !== null) {
        if (match.index > lastIndex) {
          parts.push(lineStr.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-950 bg-slate-100/60 px-1 rounded">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < lineStr.length) {
        parts.push(lineStr.substring(lastIndex));
      }

      // Italic *text*
      return parts.map((part, i) => {
        if (typeof part === "string") {
          const italicRegex = /\*(.*?)\*/g;
          const iParts = [];
          let iLastIndex = 0;
          let iMatch;

          while ((iMatch = italicRegex.exec(part)) !== null) {
            if (iMatch.index > iLastIndex) {
              iParts.push(part.substring(iLastIndex, iMatch.index));
            }
            iParts.push(<em key={iMatch.index} className="italic text-slate-900">{iMatch[1]}</em>);
            iLastIndex = italicRegex.lastIndex;
          }

          if (iLastIndex < part.length) {
            iParts.push(part.substring(iLastIndex));
          }
          return iParts.length > 0 ? iParts : part;
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check for bullet list
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const bulletText = trimmedLine.substring(2);
        listItems.push(
          <li key={`li-${index}`} className="ml-4 list-disc space-y-1 pl-1 text-[12.5px] leading-relaxed text-slate-700">
            {parseInlineStyles(bulletText)}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        // Numbered list
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const numText = trimmedLine.replace(/^\d+\.\s/, "");
        const numPrefix = trimmedLine.match(/^\d+/)?.[0] || "1";
        listItems.push(
          <li key={`li-num-${index}`} className="ml-5 list-decimal space-y-1 pl-1 text-[12.5px] leading-relaxed text-slate-700">
            {parseInlineStyles(numText)}
          </li>
        );
      } else {
        // Close list if we are in one
        if (inList) {
          elements.push(
            <ul key={`ul-${index}`} className="space-y-1.5 my-2">
              {listItems}
            </ul>
          );
          inList = false;
          listItems = [];
        }

        if (trimmedLine === "") {
          elements.push(<div key={`br-${index}`} className="h-2" />);
        } else {
          // Headers check (e.g. ### Header or **Header**)
          if (trimmedLine.startsWith("### ")) {
            elements.push(
              <h4 key={`h-${index}`} className="text-xs font-bold text-slate-900 uppercase tracking-wide mt-3 mb-1">
                {parseInlineStyles(trimmedLine.substring(4))}
              </h4>
            );
          } else {
            elements.push(
              <p key={`p-${index}`} className="text-[12.5px] leading-relaxed text-slate-700 font-normal">
                {parseInlineStyles(line)}
              </p>
            );
          }
        }
      }
    });

    // Flush final lists
    if (inList) {
      elements.push(
        <ul key="ul-final" className="space-y-1.5 my-2">
          {listItems}
        </ul>
      );
    }

    return elements;
  };

  // Submit trigger handler
  const handleSendMessage = async (textToSend?: string) => {
    const rawMessage = textToSend !== undefined ? textToSend : inputMessage;
    if (!rawMessage.trim()) return;

    if (textToSend === undefined) {
      setInputMessage("");
    }

    setErrorText(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      role: "user",
      content: rawMessage,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...messages, userMessage];
    saveChatHistory(updatedHistory);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
          documentName: selectedDocument ? selectedDocument.name : undefined,
          documentText: selectedDocument ? selectedDocument.text : undefined,
          category: selectedDocument ? selectedDocument.category : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: "msg_" + Math.random().toString(36).substr(2, 9),
        role: "assistant",
        content: data.text || "Tidak ada respons.",
        timestamp: new Date().toISOString(),
        isMock: data.isMock
      };

      saveChatHistory([...updatedHistory, assistantMessage]);
    } catch (err: any) {
      console.error("Error communicating with Chat API:", err);
      setErrorText(err.message || "Koneksi terputus ke server chatbot.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh log obrolan saat ini?")) {
      const initialWelcome: Message[] = [
        {
          id: "welcome",
          role: "assistant",
          content: "Halo! Saya adalah **DocCompare AI Assistant**. \n\nSemua riwayat percakapan telah dibersihkan. Silakan pilih dokumen acuan di atas untuk memberikan konteks khusus, atau mulailah berkonsultasi mengenai draf kontrak, addendum, maupun SOP Anda!",
          timestamp: new Date().toISOString()
        }
      ];
      saveChatHistory(initialWelcome);
      setErrorText(null);
    }
  };

  return (
    <div className="space-y-6" id="ai-chat-module">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={22} /> Konsultasi AI Terpadu (ChatAI)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan AI interaktif untuk mengajukan pertanyaan, menganalisis klausal, serta mengevaluasi risiko draf secara langsung.
          </p>
        </div>
        <button
          onClick={clearChat}
          className="bg-white hover:bg-red-50 text-red-650 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
          id="clear-chat-btn"
        >
          <Trash2 size={13} /> Bersihkan Obrolan
        </button>
      </div>

      {/* Main Structural Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Context Selector and Quick Prompts */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Reference Selector Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm" id="chat-context-card">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BookOpen size={13} className="text-blue-500" /> Dokumen Acuan AI
            </h3>

            {/* 1. Project Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Pilih Proyek Kerja</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedDocId("none"); // reset selected document
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-medium text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 transition"
                id="chat-project-select"
              >
                <option value="all">Semua Proyek Kerja</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.code} - {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Document Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Pilih Berkas Acuan</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-medium text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 transition"
                id="chat-doc-select"
              >
                <option value="none">Tanpa Acuan Dokumen (Tanya Umum)</option>
                {filteredDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    [{doc.category}] {doc.name} (v{doc.version})
                  </option>
                ))}
              </select>
            </div>

            {/* Selection Context Badge */}
            <div className="text-[11px] bg-slate-50/80 border border-slate-150 p-3 rounded-lg leading-relaxed text-slate-500">
              {selectedDocId === "none" ? (
                <p>
                  💡 <strong>Mode Konsultasi Umum:</strong> AI akan menjawab pertanyaan umum tanpa melihat file spesifik. Sangat tepat untuk menanyakan saran legal atau struktur standar draf.
                </p>
              ) : selectedDocument ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-emerald-800 font-bold">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>Konteks Siap Digali</span>
                  </div>
                  <p className="text-[10.5px]">AI telah memuat <strong>{selectedDocument.name}</strong> dengan panjang teks {(selectedDocument.text || "").length} karakter.</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm" id="chat-prompts-card">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500 animate-pulse" /> Topik Panduan Cepat
            </h3>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Klik salah satu saran di bawah ini untuk mengirimkan pertanyaan cepat mengenai berkas acuan Anda:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              {getQuickPrompts().map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!isLoading) {
                      handleSendMessage(prompt);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-200 rounded-lg text-xs font-semibold text-slate-650 hover:text-indigo-800 transition flex items-start gap-1.5 leading-relaxed cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={13} className="shrink-0 mt-0.5 text-slate-400" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Chat Container */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]" id="chat-frame">
          
          {/* Box Header Status */}
          <div className="px-5 py-3.5 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-emerald-300"></span>
              <span className="text-xs font-bold text-slate-700">Respons Terbuka - Gemini 3.5 Flash</span>
            </div>
            {selectedDocument && (
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <FileText size={10} /> Active File Context
              </span>
            )}
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" id="chat-messages-scroll">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
                >
                  {/* Avatar Icons */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border font-bold text-xs ${
                    isAssistant 
                      ? "bg-slate-100 text-blue-700 border-blue-100" 
                      : "bg-blue-600 text-white border-blue-500"
                  }`}>
                    {isAssistant ? <Bot size={15} /> : <User size={15} />}
                  </div>

                  {/* Bubble Content */}
                  <div className="space-y-1">
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isAssistant 
                        ? "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none" 
                        : "bg-blue-50/50 border border-blue-100 text-slate-800 rounded-tr-none text-left"
                    }`}>
                      <div className="space-y-1.5">
                        {renderFormattedMessage(m.content)}
                      </div>
                    </div>

                    {/* Metadata line info */}
                    <div className={`text-[9px] text-slate-400 font-medium px-2 flex items-center gap-1.5 ${
                      isAssistant ? "justify-start" : "justify-end"
                    }`}>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isAssistant && m.isMock && (
                        <span className="bg-amber-100 border border-amber-200 text-amber-700 font-black rounded-full px-1.5 py-0.2 uppercase text-[7.5px] scale-95">
                          Simulated Response
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Local Loading status indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto text-left">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-slate-100 text-blue-700 border border-blue-100">
                  <Bot size={15} />
                </div>
                <div className="space-y-1.5">
                  <div className="rounded-2xl rounded-tl-none px-4 py-3.5 bg-slate-50 border border-slate-150 shadow-sm flex items-center gap-3">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedDocId !== "none" ? "AI sedang meninjau naskah dokumen..." : "AI sedang berpikir..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Local Error alert message banner inside scroll */}
            {errorText && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start gap-2.5 max-w-[90%] mr-auto text-xs my-1" id="chat-error">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800">Gangguan Koneksi AI</h4>
                  <p className="text-slate-600 mt-0.5">{errorText}</p>
                  <button 
                    onClick={() => handleSendMessage()}
                    className="mt-2 text-red-700 hover:text-red-900 font-extrabold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    Coba Kirim Ulang <CornerDownRight size={11} />
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Message input bar */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-150 relative">
            
            {/* Autocomplete Overlay */}
            {showSuggestions && matchingDocuments.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute bottom-full left-3.5 right-3.5 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-150"
                id="doc-autocomplete-overlay"
              >
                <div className="px-3 py-2 bg-slate-100 border-b border-slate-150 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Pilih Dokumen Acuan (@)</span>
                  <span className="normal-case font-medium text-slate-400">Gunakan ↑↓ & Enter</span>
                </div>
                {matchingDocuments.map((doc, idx) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => selectDocumentFromSuggest(doc)}
                    onMouseEnter={() => setActiveSuggestIndex(idx)}
                    className={`w-full text-left px-4 py-3 text-xs flex items-center justify-between transition cursor-pointer ${
                      idx === activeSuggestIndex ? "bg-blue-50 text-blue-950 font-bold" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText size={14} className={idx === activeSuggestIndex ? "text-blue-600" : "text-slate-400"} />
                      <span className="truncate">{doc.name}</span>
                    </div>
                    <span className="text-[9px] bg-slate-150 border border-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 ml-2">
                      {doc.category}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
              id="chat-form-element"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={
                  selectedDocId === "none"
                    ? "Ketik asisten tanya umum (Ketik @ untuk memanggil dokumen)..."
                    : `Tanyakan asisten mengenai berkas "${selectedDocument?.name}"...`
                }
                className="flex-1 text-xs border border-slate-200 bg-white rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-850 placeholder-slate-400 transition"
                id="chat-text-input"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-sm transition shrink-0 cursor-pointer flex items-center justify-center"
                id="chat-send-btn"
              >
                <Send size={15} />
              </button>
            </form>
            <p className="text-[9.5px] text-slate-400 mt-1.5 text-center leading-normal">
              Secara legalitas formal, asisten virtual DocCompare AI bertindak sebagai second-opinion asisten kepatuhan. Harap tinjau ulang untuk keputusan hukum akhir.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

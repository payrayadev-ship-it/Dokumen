import React, { useState } from "react";
import { Project, Document, ComparisonReport, UserRole } from "../types";
import { generateVisualDiffs, DiffLine } from "../utils/documentParser";
import { 
  Dna, ArrowRight, Sparkles, AlertTriangle, AlertCircle, CheckCircle, 
  Download, Printer, Columns, FileText, ChevronRight, Play, Eye, RotateCcw
} from "lucide-react";

interface ComparisonModuleProps {
  projects: Project[];
  documents: Document[];
  reports: ComparisonReport[];
  currentUserRole: UserRole;
  selectedReportFromDashboard: ComparisonReport | null;
  onClearSelectedReport: () => void;
  onSaveReport: (report: Omit<ComparisonReport, "id" | "timestamp">) => void;
}

export default function ComparisonModule({
  projects,
  documents,
  reports,
  currentUserRole,
  selectedReportFromDashboard,
  onClearSelectedReport,
  onSaveReport,
}: ComparisonModuleProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [docAId, setDocAId] = useState("");
  const [docBId, setDocBId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"ai_insights" | "side_by_side">("ai_insights");
  const [aiReport, setAiReport] = useState<ComparisonReport | null>(selectedReportFromDashboard);

  // Filter documents associated to the selected project
  const projectDocs = documents.filter((d) => d.projectId === projectId);

  // Sync state if a report was selected from the dashboard
  React.useEffect(() => {
    if (selectedReportFromDashboard) {
      setAiReport(selectedReportFromDashboard);
      setProjectId(selectedReportFromDashboard.projectId);
      setDocAId(selectedReportFromDashboard.docAId);
      setDocBId(selectedReportFromDashboard.docBId);
      onClearSelectedReport(); // Reset dashboard selection
    }
  }, [selectedReportFromDashboard]);

  const handleRunComparison = async () => {
    if (!docAId || !docBId) {
      alert("Harap pilih Dokumen A (lama) dan Dokumen B (baru) untuk dibandingkan.");
      return;
    }
    if (docAId === docBId) {
      alert("Dokumen A dan Dokumen B tidak boleh dokumen yang sama.");
      return;
    }

    const docA = documents.find((d) => d.id === docAId)!;
    const docB = documents.find((d) => d.id === docBId)!;

    setIsLoading(true);
    setLoadStatus("Mengekstrak struktur naskah dokumen...");

    setTimeout(() => {
      setLoadStatus("Menghubungi AI Engine (Gemini 3.5 Flash) untuk analisa...");
    }, 1200);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docAName: docA.name,
          docBName: docB.name,
          docAText: docA.text,
          docBText: docB.text,
          category: docA.category,
          fileType: docA.name.split(".").pop() || "txt",
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperoleh respon dari server.");
      }

      const rawResult = await response.json();
      
      const newReport: Omit<ComparisonReport, "id" | "timestamp"> = {
        projectId,
        docAId,
        docBId,
        docAName: docA.name,
        docBName: docB.name,
        category: docA.category,
        isMock: rawResult.isMock || false,
        summary: rawResult.summary,
        changes: rawResult.changes || [],
        recommendations: rawResult.recommendations || [],
        executiveSummary: rawResult.executiveSummary || "",
        importantChanges: rawResult.importantChanges || "",
        contractRisks: rawResult.contractRisks || "",
        financialRisks: rawResult.financialRisks || "",
        scheduleRisks: rawResult.scheduleRisks || "",
        legalRisks: rawResult.legalRisks || "",
        operationalRisks: rawResult.operationalRisks || "",
        recommendationActions: rawResult.recommendationActions || "",
      };

      onSaveReport(newReport);
      // Wait for parent component state sync then display report
      setAiReport({
        id: Math.random().toString(),
        timestamp: new Date().toISOString(),
        ...newReport,
      });
      setActiveTab("ai_insights");
    } catch (err: any) {
      alert(`Error perbandingan: ${err.message}. Layanan beralih ke local mock.`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentDocA = documents.find((d) => d.id === docAId);
  const currentDocB = documents.find((d) => d.id === docBId);

  // Generate local visualization diffs if documents are loaded
  const visualDiffs = currentDocA && currentDocB 
    ? generateVisualDiffs(currentDocA.text, currentDocB.text) 
    : [];

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical": return "bg-red-600 text-white border-red-700";
      case "high": return "bg-orange-500 text-white border-orange-600";
      case "medium": return "bg-yellow-500 text-gray-900 border-yellow-600";
      default: return "bg-green-500 text-white border-green-600";
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical": return "text-red-700 bg-red-50 border border-red-200";
      case "high": return "text-orange-750 bg-orange-50 border border-orange-200";
      case "medium": return "text-yellow-800 bg-yellow-50 border border-yellow-200";
      default: return "text-green-700 bg-green-50 border border-green-200";
    }
  };

  // Export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!aiReport) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tipe Perubahan,Aspek/Kategori,Nilai Lama,Nilai Baru,Tingkat Risiko\n";
    
    aiReport.changes.forEach((ch) => {
      const row = `"${ch.type}","${ch.category}","${ch.oldValue.replace(/"/g, '""')}","${ch.newValue.replace(/"/g, '""')}","${ch.risk}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Perbedaan_${aiReport.docAName}_vs_${aiReport.docBName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = () => {
    if (!aiReport) return;
    const htmlContent = `
      <html>
      <head><style>body { font-family: sans-serif; }</style></head>
      <body>
        <h1>Laporan Hasil Analisa AI - DocCompare AI</h1>
        <p>Proyek: #${aiReport.projectId}</p>
        <p>Dokumen A: ${aiReport.docAName}</p>
        <p>Dokumen B: ${aiReport.docBName}</p>
        <p>Tanggal Analisa: ${new Date(aiReport.timestamp || "").toLocaleDateString()}</p>
        <hr/>
        <h2>1. Ringkasan Eksekutif</h2>
        <p>${aiReport.executiveSummary}</p>
        <h2>2. Perubahan Penting</h2>
        <p>${aiReport.importantChanges}</p>
        <h2>3. Risiko Kontrak</h2>
        <p>${aiReport.contractRisks}</p>
        <h2>4. Risiko Keuangan</h2>
        <p>${aiReport.financialRisks}</p>
        <h2>5. Risiko Jadwal</h2>
        <p>${aiReport.scheduleRisks}</p>
        <h2>6. Risiko Hukum</h2>
        <p>${aiReport.legalRisks}</p>
        <h2>7. Risiko Operasional</h2>
        <p>${aiReport.operationalRisks}</p>
        <h2>8. Rekomendasi Tindakan</h2>
        <p>${aiReport.recommendationActions}</p>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Perbedaan_${aiReport.docAName}_vs_${aiReport.docBName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Selector Heading Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Dna size={14} className="text-blue-600" /> Konfigurasi Perbandingan AI
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Proyek Target Kerja
            </label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setDocAId("");
                setDocBId("");
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none cursor-pointer text-slate-800 transition"
            >
              <option value="">-- Pilih Proyek --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Dokumen A (Versi Lama)
            </label>
            <select
              value={docAId}
              onChange={(e) => setDocAId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none cursor-pointer text-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!projectId}
            >
              <option value="">-- Pilih Dokumen A (Lama) --</option>
              {projectDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.category}] {d.name} (v{d.version})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Dokumen B (Versi Baru)
            </label>
            <select
              value={docBId}
              onChange={(e) => setDocBId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none cursor-pointer text-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!projectId}
            >
              <option value="">-- Pilih Dokumen B (Baru) --</option>
              {projectDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.category}] {d.name} (v{d.version})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          {aiReport && (
            <button
              onClick={() => {
                setAiReport(null);
                setDocAId("");
                setDocBId("");
              }}
              className="px-4 py-2 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-500 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} /> Berhenti / Reset Tab
            </button>
          )}
          <button
            onClick={handleRunComparison}
            disabled={isLoading || !docAId || !docBId}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            {isLoading ? "Proses Analisa..." : "Mulai Bandingkan"}
          </button>
        </div>
      </div>

      {/* Loading Block */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Sparkles size={24} className="text-slate-800 animate-spin" />
          </div>
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest">Menjalankan Komparasi Kontrak & Dokumen</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{loadStatus}</p>
          <div className="w-48 bg-slate-100 h-1 rounded-full mx-auto overflow-hidden">
            <div className="bg-slate-700 h-full animate-infinite-loading w-1/3 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Results Workspace */}
      {aiReport && !isLoading && (
        <div className="space-y-6">
          {/* Top Status & Export Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-1 font-bold text-[10px] uppercase rounded border ${getRiskColor(aiReport.summary.riskLevel)}`}>
                Sistem Risiko: {aiReport.summary.riskLevel}
              </span>
              {aiReport.isMock && (
                <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                  Demo Mode (Simulasi AI)
                </span>
              )}
            </div>

            {/* Export and Print Group */}
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Printer size={14} /> Cetak/PDF
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Download size={14} /> Ekspor Excel
              </button>
              <button
                onClick={handleExportWord}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <FileText size={14} /> Ekspor Word
              </button>
            </div>
          </div>

          {/* KPI Comparison Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Perubahan</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{aiReport.summary.totalChanges}</span>
            </div>
            <div className="bg-white border text-emerald-800 border-slate-200 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Teks Ditambahkan</span>
              <span className="text-2xl font-bold text-emerald-600 block mt-1">+{aiReport.summary.added}</span>
            </div>
            <div className="bg-white border text-rose-800 border-slate-200 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Klausul Dihapus</span>
              <span className="text-2xl font-bold text-rose-600 block mt-1">-{aiReport.summary.deleted}</span>
            </div>
            <div className="bg-white border text-amber-850 border-slate-200 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Aspek Diubah (Amended)</span>
              <span className="text-2xl font-bold text-amber-600 block mt-1">{aiReport.summary.modified}</span>
            </div>
          </div>

          {/* Toggle View Options */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("ai_insights")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "ai_insights"
                  ? "border-slate-800 text-slate-950"
                  : "border-transparent text-slate-400 hover:text-slate-800"
              }`}
            >
              <Sparkles size={14} /> Hasil Analisa AI Gemini
            </button>
            <button
              onClick={() => setActiveTab("side_by_side")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "side_by_side"
                  ? "border-slate-800 text-slate-950"
                  : "border-transparent text-slate-400 hover:text-slate-800"
              }`}
            >
              <Columns size={14} /> Dokumen Bersebelahan (Side-by-Side)
            </button>
          </div>

          {/* Content panel */}
          {activeTab === "ai_insights" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Gemini Report Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Ringkasan Eksekutif */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-slate-800 rounded"></span> 1. Ringkasan Eksekutif
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aiReport.executiveSummary}</p>
                </div>

                {/* 2. Perubahan Penting */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-slate-800 rounded"></span> 2. Perubahan Penting
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aiReport.importantChanges}</p>
                </div>

                {/* 3-7 Risk Models Grid */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pt-2">
                    Pemodelan Analisa Risiko Terpadu
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Risiko Kontrak */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full w-fit">
                        Risiko Kontrak
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{aiReport.contractRisks}</p>
                    </div>

                    {/* Risiko Keuangan */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full w-fit">
                        Risiko Keuangan
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{aiReport.financialRisks}</p>
                    </div>

                    {/* Risiko Jadwal */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full w-fit">
                        Risiko Jadwal
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{aiReport.scheduleRisks}</p>
                    </div>

                    {/* Risiko Hukum */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-violet-750 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full w-fit">
                        Risiko Hukum
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{aiReport.legalRisks}</p>
                    </div>

                    {/* Risiko Operasional */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 col-span-1 md:col-span-2">
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-full w-fit">
                        Risiko Operasional & SOP
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{aiReport.operationalRisks}</p>
                    </div>
                  </div>
                </div>

                {/* 8. Rekomendasi Tindakan */}
                <div className="bg-slate-900 border border-slate-950 text-white rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-100">
                    <Sparkles size={14} className="text-amber-400" /> Rekomendasi Tindakan
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{aiReport.recommendationActions}</p>
                </div>
              </div>

              {/* Right Column: Key changes logging, and Recommendations quick action card */}
              <div className="space-y-6">
                {/* AI structured recommendations list */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <h4 className="font-bold text-xs text-slate-900 border-b border-slate-150 pb-2 uppercase tracking-wide">
                    Daftar Rekomendasi AI
                  </h4>
                  <ul className="space-y-3">
                    {aiReport.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                        <ChevronRight className="text-slate-800 shrink-0 mt-0.5" size={14} />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tabular Change log */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">Signatur Perubahan Terdaftar</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {aiReport.changes.map((ch, idx) => (
                      <div key={idx} className="border border-slate-200 p-2.5 rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{ch.category}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${getRiskBadge(ch.risk)}`}>
                            {ch.risk} risk
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-rose-600 block font-medium">Lama:</span>
                            <span className="block truncate text-slate-600" title={ch.oldValue}>{ch.oldValue || "-"}</span>
                          </div>
                          <div>
                            <span className="text-emerald-600 block font-medium">Baru:</span>
                            <span className="block truncate text-slate-600" title={ch.newValue}>{ch.newValue || "-"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Side-by-Side visual differential renderer */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[70vh] bg-slate-900 text-slate-100 rounded-xl p-4 overflow-hidden border border-slate-950">
              {/* Left Canvas: Document A */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider flex justify-between">
                  <span>Sebelumnya (Lama)</span>
                  <span className="text-rose-400 font-semibold">{aiReport.docAName}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 leading-relaxed">
                  {visualDiffs.length === 0 ? (
                    <p className="text-slate-500 text-center py-12">Belum mengevaluasi teks.</p>
                  ) : (
                    visualDiffs.map((diff, idx) => {
                      const isDeleted = diff.type === "deleted";
                      const isSame = diff.type === "same";
                      const isModified = diff.type === "modified";

                      return (
                        <div 
                          key={diff.id} 
                          className={`p-1.5 rounded transition ${
                            isDeleted 
                              ? "bg-red-950/70 text-red-200 border-l-4 border-red-500" 
                              : isModified 
                              ? "bg-yellow-950/30 text-yellow-101 border-l-4 border-yellow-500" 
                              : isSame 
                              ? "text-slate-400"
                              : "opacity-40"
                          }`}
                        >
                          <span className="text-[8px] text-slate-600 mr-2 select-none">{idx + 1}</span>
                          <span>{diff.textA || " "}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Canvas: Document B */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider flex justify-between">
                  <span>Sesudahnya (Baru)</span>
                  <span className="text-emerald-400 font-semibold">{aiReport.docBName}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 leading-relaxed">
                  {visualDiffs.length === 0 ? (
                    <p className="text-slate-500 text-center py-12">Belum mengevaluasi teks.</p>
                  ) : (
                    visualDiffs.map((diff, idx) => {
                      const isAdded = diff.type === "added";
                      const isSame = diff.type === "same";
                      const isModified = diff.type === "modified";

                      return (
                        <div 
                          key={diff.id} 
                          className={`p-1.5 rounded transition ${
                            isAdded 
                              ? "bg-green-950/70 text-green-200 border-l-4 border-green-500" 
                              : isModified 
                              ? "bg-yellow-950/30 text-yellow-101 border-l-4 border-yellow-500" 
                              : isSame 
                              ? "text-slate-400"
                              : "opacity-40"
                          }`}
                        >
                          <span className="text-[8px] text-slate-600 mr-2 select-none">{idx + 1}</span>
                          <span>{diff.textB || " "}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* When no analysis runs or display, guide user */}
      {!aiReport && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Sparkles className="mx-auto text-slate-700 mb-3" size={32} />
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 leading-snug">Jalankan Perbandingan Cerdas Bersama AI</h4>
          <p className="text-xs text-slate-550 max-w-md mx-auto mt-1.5">
            Harap tentukan proyek, dokumen asal (versi lama), dan dokumen pembanding (versi baru), lalu klik "Mulai Bandingkan". Kami akan mendeteksi variabilitas nominal & pasal penting secara kilat.
          </p>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Project, Document, ComparisonReport, UserRole } from "../types";
import { generateVisualDiffs, DiffLine } from "../utils/documentParser";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { 
  Dna, ArrowRight, Sparkles, AlertTriangle, AlertCircle, CheckCircle, 
  Download, Printer, Columns, FileText, ChevronRight, Play, Eye, RotateCcw,
  BarChart3
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

  const handleExportPDF = () => {
    if (!aiReport) return;
    const doc = new jsPDF();
    
    let y = 15;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - 2 * margin; // ~180

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > doc.internal.pageSize.height - 15) {
        doc.addPage();
        y = 15;
      }
    };

    const addHeader = (title: string) => {
      checkPageBreak(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(title, margin, y);
      y += 4;
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;
    };

    const addParagraph = (text: string) => {
      if (!text) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600
      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = 4.5;
      lines.forEach((line: string) => {
        checkPageBreak(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 3;
    };

    const addBullet = (text: string) => {
      if (!text) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600
      const bulletPrefix = "- ";
      const fullText = bulletPrefix + text;
      const lines = doc.splitTextToSize(fullText, contentWidth - 4);
      const lineHeight = 4.5;
      lines.forEach((line: string, index: number) => {
        checkPageBreak(lineHeight);
        if (index === 0) {
          doc.text(line, margin, y);
        } else {
          doc.text(line, margin + 4, y);
        }
        y += lineHeight;
      });
      y += 1.5;
    };

    // 1. Doc Header / Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text("LAPORAN PERBANDINGAN DOKUMEN AI", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`Dihasilkan oleh DocCompare AI pada ${new Date(aiReport.timestamp || "").toLocaleString("id-ID")}`, margin, y);
    y += 9;

    // Metadata Card
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252); // Slate-50 background tint
    doc.rect(margin, y, contentWidth, 31, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("METADATA ANALISA:", margin + 5, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Proyek: #${aiReport.projectId}`, margin + 5, y + 11);
    doc.text(`Kategori: ${aiReport.category || "Umum"}`, margin + 5, y + 16);
    doc.text(`Tingkat Risiko: ${aiReport.summary.riskLevel.toUpperCase()}`, margin + 5, y + 21);
    doc.text(`Dokumen A (Lama): ${aiReport.docAName}`, margin + 5, y + 26);
    doc.text(`Dokumen B (Baru): ${aiReport.docBName}`, margin + 90, y + 26);
    
    y += 37;

    // Add metrics counters summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Ringkasan Temuan: ${aiReport.summary.totalChanges} Perubahan Terdeteksi`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`- Teks Ditambahkan: ${aiReport.summary.added}`, margin + 5, y);
    doc.text(`- Klausul Dihapus: ${aiReport.summary.deleted}`, margin + 60, y);
    doc.text(`- Aspek Diubah: ${aiReport.summary.modified}`, margin + 115, y);
    y += 10;

    // Sections
    addHeader("1. Ringkasan Eksekutif");
    addParagraph(aiReport.executiveSummary);

    addHeader("2. Perubahan Penting");
    addParagraph(aiReport.importantChanges);

    addHeader("3. Analisa Model Risiko");
    
    if (aiReport.contractRisks) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38); // Red-600
      checkPageBreak(8);
      doc.text("Risiko Kontrak:", margin, y);
      y += 4;
      addParagraph(aiReport.contractRisks);
    }

    if (aiReport.financialRisks) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(234, 88, 12); // Orange-600
      checkPageBreak(8);
      doc.text("Risiko Keuangan:", margin, y);
      y += 4;
      addParagraph(aiReport.financialRisks);
    }

    if (aiReport.scheduleRisks) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6); // Amber-600
      checkPageBreak(8);
      doc.text("Risiko Jadwal:", margin, y);
      y += 4;
      addParagraph(aiReport.scheduleRisks);
    }

    if (aiReport.legalRisks) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(124, 58, 237); // Violet-600
      checkPageBreak(8);
      doc.text("Risiko Hukum:", margin, y);
      y += 4;
      addParagraph(aiReport.legalRisks);
    }

    if (aiReport.operationalRisks) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600
      checkPageBreak(8);
      doc.text("Risiko Operasional & SOP:", margin, y);
      y += 4;
      addParagraph(aiReport.operationalRisks);
    }

    addHeader("4. Rekomendasi Tindakan AI");
    addParagraph(aiReport.recommendationActions);

    if (aiReport.recommendations && aiReport.recommendations.length > 0) {
      addHeader("5. Daftar Rekomendasi Cepat");
      aiReport.recommendations.forEach((rec) => {
        addBullet(rec);
      });
      y += 4;
    }

    if (aiReport.changes && aiReport.changes.length > 0) {
      addHeader("6. Detail Signatur Perubahan");
      aiReport.changes.forEach((ch, idx) => {
        checkPageBreak(25);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. Kategori: ${ch.category} (Risiko: ${ch.risk.toUpperCase()})`, margin, y);
        y += 4;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(220, 38, 38); // red for old
        const oldLines = doc.splitTextToSize(`Sebelumnya: ${ch.oldValue || "-"}`, contentWidth - 4);
        oldLines.forEach((line: string) => {
          checkPageBreak(4);
          doc.text(line, margin + 4, y);
          y += 4;
        });

        doc.setTextColor(22, 163, 74); // green for new
        const newLines = doc.splitTextToSize(`Sesudahnya: ${ch.newValue || "-"}`, contentWidth - 4);
        newLines.forEach((line: string) => {
          checkPageBreak(4);
          doc.text(line, margin + 4, y);
          y += 4;
        });
        y += 2.5;
      });
    }

    doc.save(`Laporan_Analisa_AI_${aiReport.docAName}_vs_${aiReport.docBName}.pdf`);
  };

  const handleExportExcel = () => {
    if (!aiReport) return;
    
    // Tab 1: Ringkasan & Risiko
    const summaryData = [
      ["LAPORAN ANALISA PERBANDINGAN DOKUMEN AI"],
      [],
      ["METADATA LAPORAN"],
      ["ID Proyek", aiReport.projectId],
      ["Dokumen A (Lama)", aiReport.docAName],
      ["Dokumen B (Baru)", aiReport.docBName],
      ["Kategori", aiReport.category || "Umum"],
      ["Tingkat Risiko Utama", aiReport.summary.riskLevel],
      ["Tanggal Analisa", new Date(aiReport.timestamp || "").toLocaleString("id-ID")],
      [],
      ["RINGKASAN METRIKS"],
      ["Total Deteksi Perubahan", aiReport.summary.totalChanges],
      ["Ditambahkan", aiReport.summary.added],
      ["Dihapus", aiReport.summary.deleted],
      ["Diubah (Amended)", aiReport.summary.modified],
      [],
      ["ANALISA RISIKO & REKOMENDASI TINDAKAN"],
      ["Ringkasan Eksekutif", aiReport.executiveSummary],
      ["Perubahan Penting", aiReport.importantChanges],
      ["Risiko Kontrak", aiReport.contractRisks || "-"],
      ["Risiko Keuangan", aiReport.financialRisks || "-"],
      ["Risiko Jadwal", aiReport.scheduleRisks || "-"],
      ["Risiko Hukum", aiReport.legalRisks || "-"],
      ["Risiko Operasional & SOP", aiReport.operationalRisks || "-"],
      ["Rekomendasi Tindakan AI", aiReport.recommendationActions || "-"],
    ];

    // Tab 2: Perubahan Detail
    const changesData = aiReport.changes.map((ch, index) => ({
      "No": index + 1,
      "Aspek/Kategori": ch.category,
      "Tipe Perubahan": ch.type === "added" ? "Ditambahkan" : ch.type === "deleted" ? "Dihapus" : "Diubah (Amended)",
      "Nilai Lama (Sebelumnya)": ch.oldValue || "-",
      "Nilai Baru (Sesudahnya)": ch.newValue || "-",
      "Tingkat Risiko": ch.risk.toUpperCase()
    }));

    // Create Work Book
    const wb = XLSX.utils.book_new();

    // Append sheets
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan & Analisa Risiko");

    const wsChanges = XLSX.utils.json_to_sheet(changesData);
    XLSX.utils.book_append_sheet(wb, wsChanges, "Log Signatur Perubahan");

    // Save Workbook
    XLSX.writeFile(wb, `Laporan_Perbedaan_${aiReport.docAName}_vs_${aiReport.docBName}.xlsx`);
  };

  const handleExportWord = () => {
    if (!aiReport) return;
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Laporan Hasil Analisa AI - DocCompare AI</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333333;
            margin: 1in;
          }
          h1 {
            color: #0f172a;
            font-size: 18pt;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 6px;
            margin-bottom: 20px;
          }
          h2 {
            color: #1e293b;
            font-size: 14pt;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 25px;
            margin-bottom: 12px;
          }
          h3 {
            color: #334155;
            font-size: 11pt;
            margin-top: 15px;
            margin-bottom: 5px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            background-color: #f8fafc;
          }
          .meta-table td {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            font-size: 10pt;
          }
          .meta-label {
            font-weight: bold;
            color: #475569;
            width: 25%;
          }
          .risk-badge {
            font-weight: bold;
            color: #ffffff;
            padding: 2px 6px;
            background-color: #ef4444;
            border-radius: 4px;
          }
          .changes-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 20px;
          }
          .changes-table th {
            background-color: #1e293b;
            color: #ffffff;
            text-align: left;
            padding: 10px;
            font-size: 10pt;
            font-weight: bold;
            border: 1px solid #e2e8f0;
          }
          .changes-table td {
            padding: 10px;
            border: 1px solid #e2e8f0;
            font-size: 9.5pt;
          }
          .deleted {
            color: #b91c1c;
          }
          .added {
            color: #15803d;
          }
          .modified {
            color: #d97706;
          }
          .recommendation-box {
            background-color: #1e293b;
            color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .recommendation-title {
            font-weight: bold;
            font-size: 12pt;
            color: #fbbf24;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <h1>LAPORAN ANALISA PERBANDINGAN DOKUMEN AI</h1>
        <p style="font-size: 9pt; color: #64748b;">Dihasilkan secara otomatis oleh DocCompare AI pada ${new Date(aiReport.timestamp || "").toLocaleString("id-ID")}</p>
        
        <table class="meta-table">
          <tr>
            <td class="meta-label">Proyek Kerja</td>
            <td>#${aiReport.projectId}</td>
            <td class="meta-label">Kategori</td>
            <td>${aiReport.category || "Umum"}</td>
          </tr>
          <tr>
            <td class="meta-label">Dokumen Lama (A)</td>
            <td>${aiReport.docAName}</td>
            <td class="meta-label">Dokumen Baru (B)</td>
            <td>${aiReport.docBName}</td>
          </tr>
          <tr>
            <td class="meta-label">Tingkat Risiko Utama</td>
            <td><span class="risk-badge" style="background-color: ${aiReport.summary.riskLevel.toLowerCase() === 'high' || aiReport.summary.riskLevel.toLowerCase() === 'critical' ? '#ef4444' : aiReport.summary.riskLevel.toLowerCase() === 'medium' ? '#f59e0b' : '#10b981'}">${aiReport.summary.riskLevel.toUpperCase()}</span></td>
            <td class="meta-label">Total Deteksi Perubahan</td>
            <td><strong>${aiReport.summary.totalChanges} Perubahan</strong> (+${aiReport.summary.added} | -${aiReport.summary.deleted} | *${aiReport.summary.modified})</td>
          </tr>
        </table>

        <h2>1. Ringkasan Eksekutif</h2>
        <p style="text-align: justify; white-space: pre-wrap;">${aiReport.executiveSummary}</p>

        <h2>2. Perubahan Penting (Key Variations)</h2>
        <p style="text-align: justify; white-space: pre-wrap;">${aiReport.importantChanges}</p>

        <h2>3. Pemodelan Analisa Risiko Terpadu</h2>
        
        <h3>A. Risiko Kontrak</h3>
        <p style="text-align: justify; color: #475569;">${aiReport.contractRisks || "Tidak ada risiko kontraktual yang terdeteksi secara parsial."}</p>
        
        <h3>B. Risiko Keuangan & Pengeluaran</h3>
        <p style="text-align: justify; color: #475569;">${aiReport.financialRisks || "Tidak ada fluktuasi finansial atau biaya yang mencurigakan."}</p>
        
        <h3>C. Risiko Jadwal & Timeline</h3>
        <p style="text-align: justify; color: #475569;">${aiReport.scheduleRisks || "Timeline dan jadwal serah-terima diidentifikasi tetap aman."}</p>
        
        <h3>D. Risiko Hukum & Klausula Legal</h3>
        <p style="text-align: justify; color: #475569;">${aiReport.legalRisks || "Naskah tunduk penuh pada yurisdiksi regulasi yang sah."}</p>
        
        <h3>E. Risiko Operasional & Standar Prosedur Kerja (SOP)</h3>
        <p style="text-align: justify; color: #475569;">${aiReport.operationalRisks || "Tidak ada diskrepansi langkah operasional yang beralih."}</p>

        <div class="recommendation-box">
          <div class="recommendation-title">&#9733; REKOMENDASI TINDAKAN UTAMA</div>
          <p style="color: #cbd5e1; font-size: 10pt; line-height: 1.6; white-space: pre-wrap;">${aiReport.recommendationActions}</p>
        </div>

        <h2>4. Rekomendasi Cepat AI</h2>
        <ul>
          ${aiReport.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>

        <h2>5. Signatur Log Perubahan Terperinci</h2>
        <table class="changes-table">
          <thead>
            <tr>
              <th style="width: 5%">No</th>
              <th style="width: 25%">Aspek / Kategori</th>
              <th style="width: 10%">Risiko</th>
              <th style="width: 30%">Klausul Lama (Dokumen A)</th>
              <th style="width: 30%">Klausul Baru (Dokumen B)</th>
            </tr>
          </thead>
          <tbody>
            ${aiReport.changes.map((ch, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${ch.category}</strong></td>
                <td><span style="font-weight: bold; color: ${ch.risk.toLowerCase() === 'high' || ch.risk.toLowerCase() === 'critical' ? '#ef4444' : ch.risk.toLowerCase() === 'medium' ? '#d97706' : '#10b981'}">${ch.risk.toUpperCase()}</span></td>
                <td class="deleted">${ch.oldValue || "-"}</td>
                <td class="added">${ch.newValue || "-"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Analisa_AI_${aiReport.docAName}_vs_${aiReport.docBName}.doc`;
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
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportPDF}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <FileText size={14} className="text-red-500" /> Ekspor PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Download size={14} className="text-emerald-600" /> Ekspor Excel
              </button>
              <button
                onClick={handleExportWord}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <FileText size={14} className="text-blue-600" /> Ekspor Word
              </button>
              <button
                onClick={handlePrint}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Printer size={14} className="text-slate-500" /> Cetak Halaman
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

          {/* Visual Document Variance and Similarity Chart Card */}
          {(() => {
            const linesTotal = visualDiffs.length || 1;
            const sameLinesCount = visualDiffs.filter((v) => v.type === "same").length;
            const addedLinesCount = visualDiffs.filter((v) => v.type === "added").length;
            const deletedLinesCount = visualDiffs.filter((v) => v.type === "deleted").length;
            const modifiedLinesCount = visualDiffs.filter((v) => v.type === "modified").length;

            const percentSame = Math.round((sameLinesCount / linesTotal) * 100);
            const percentAdded = Math.round((addedLinesCount / linesTotal) * 100);
            const percentDeleted = Math.round((deletedLinesCount / linesTotal) * 100);
            const percentModified = Math.round((modifiedLinesCount / linesTotal) * 100);
            const totalChangesCount = addedLinesCount + deletedLinesCount + modifiedLinesCount;
            const percentChanged = Math.min(100, Math.round((totalChangesCount / linesTotal) * 100));
            const similarityScore = 100 - percentChanged;

            return (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                       <BarChart3 size={14} className="text-blue-600 animate-pulse" /> Ringkasan Analisa Volumetrik & Kemiripan Dokumen
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Statistik segmentasi baris naskah lama versi <strong>{aiReport.docAName}</strong> vs baru versi <strong>{aiReport.docBName}</strong>.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] bg-slate-100 font-bold border border-slate-200 text-slate-700 px-2.5 py-1 rounded inline-block">
                      Menganalisis {linesTotal} Baris Teks
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1 items-center">
                  {/* Left Pane - Donut chart style representation */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-150 pb-5 md:pb-0 md:pr-6">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.2"
                          stroke="currentColor"
                          fill="transparent"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-600 transition-all duration-1000 ease-out"
                          strokeDasharray={`${similarityScore}, 100`}
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-bold tracking-tight text-slate-900 block">{similarityScore}%</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Kemiripan</span>
                      </div>
                    </div>
                    <div className="text-center mt-3 space-y-0.5">
                      <p className="text-xs font-bold text-slate-705">Rasio Orisinalitas Kontrak</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {similarityScore >= 90 ? "🟢 Sangat Serupa (Amandemen Ringan)" : similarityScore >= 70 ? "🟡 Perubahan Moderat" : "🔴 Revisi Total / Mayor"}
                      </p>
                    </div>
                  </div>

                  {/* Right Pane - Bar charts layout */}
                  <div className="md:col-span-8 space-y-3.5">
                    <div className="space-y-3">
                      {/* 1. Unchanged Line Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-slate-350 rounded-full"></span>
                            Teks Tidak Berubah (Konsisten)
                          </span>
                          <span className="font-bold text-slate-800">{sameLinesCount} baris ({percentSame}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-slate-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${percentSame}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 2. Added Line Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                            Klausul Baru (Ditambahkan)
                          </span>
                          <span className="font-bold text-emerald-600">+{addedLinesCount} baris ({percentAdded}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${percentAdded}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 3. Deleted Line Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                            Klausul Dihapus
                          </span>
                          <span className="font-bold text-rose-600">-{deletedLinesCount} baris ({percentDeleted}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${percentDeleted}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 4. Modified Line Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                            Amandemen Frasa (Dimodifikasi)
                          </span>
                          <span className="font-bold text-amber-600">{modifiedLinesCount} baris ({percentModified}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${percentModified}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-[10px] text-slate-500 leading-normal">
                      <span className="font-bold text-blue-600 shrink-0">Petunjuk Teknis:</span>
                      <span>Grafik volumetric di atas membandingkan jumlah baris perubahan naskah nyata secara real-time. Untuk visualisasi paragraf demi paragraf, klik tab <strong>Dokumen Bersebelahan</strong> di bawah ini.</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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

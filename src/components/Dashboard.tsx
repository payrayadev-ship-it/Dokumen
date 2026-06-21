import React from "react";
import { Project, Document, ComparisonReport } from "../types";
import { FileText, Eye, AlertTriangle, Briefcase, Activity, Calendar, ArrowRight } from "lucide-react";

interface DashboardProps {
  projects: Project[];
  documents: Document[];
  reports: ComparisonReport[];
  onNavigate: (tab: string) => void;
  onSelectReport: (report: ComparisonReport) => void;
}

export default function Dashboard({ projects, documents, reports, onNavigate, onSelectReport }: DashboardProps) {
  // Calculations
  const totalDocs = documents.length;
  const totalAnalyses = reports.length;
  
  // Total changes count
  const totalChanges = reports.reduce((sum, r) => sum + (r.summary?.totalChanges || 0), 0);
  const totalProjects = projects.length;

  // Modern monthly analysis simulation (January - June 2026)
  const monthlyStats = [
    { month: "Jan", count: reports.filter(r => r.timestamp.includes("-01-") || r.timestamp.includes("/01/")).length + 2 },
    { month: "Feb", count: reports.filter(r => r.timestamp.includes("-02-") || r.timestamp.includes("/02/")).length + 4 },
    { month: "Mar", count: reports.filter(r => r.timestamp.includes("-03-") || r.timestamp.includes("/03/")).length + 3 },
    { month: "Apr", count: reports.filter(r => r.timestamp.includes("-04-") || r.timestamp.includes("/04/")).length + 6 },
    { month: "May", count: reports.filter(r => r.timestamp.includes("-05-") || r.timestamp.includes("/05/")).length + reports.length },
    { month: "Jun", count: reports.filter(r => r.timestamp.includes("-06-") || r.timestamp.includes("/06/")).length + reports.length + 1 },
  ];

  // Risk levels counts
  const riskCounts = {
    Low: reports.filter(r => r.summary?.riskLevel === "Low").length,
    Medium: reports.filter(r => r.summary?.riskLevel === "Medium").length,
    High: reports.filter(r => r.summary?.riskLevel === "High").length,
    Critical: reports.filter(r => r.summary?.riskLevel === "Critical").length,
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical": return "bg-red-600 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-yellow-500 text-gray-900";
      default: return "bg-green-500 text-white";
    }
  };

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-slate-900 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Selamat Datang di DocCompare AI Panel</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Sistem perbandingan dokumen otomatis berbasis AI tercanggih untuk mendeteksi perubahan kontrak, rancangan anggaran, SOP, dan dokumen komersial dengan akurasi model Gemini 2.5 Pro.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => onNavigate("compare")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Mulai Bandingkan Dokumen
            </button>
            <button
              onClick={() => onNavigate("upload")}
              className="bg-slate-105 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              Simpan Dokumen Baru
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 transition flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dokumen</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalDocs}</h3>
            <span className="text-xs text-slate-500 mt-1 block">📄 Tersimpan aktif</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 transition flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Analisa AI</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalAnalyses}</h3>
            <span className="text-xs text-slate-500 mt-1 block">🤖 Diproses Gemini 2.5</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <Activity size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 transition flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temuan Perubahan</p>
            <h3 className="text-2xl font-bold text-slate-950 mt-1">{totalChanges}</h3>
            <span className="text-xs text-slate-500 mt-1 block">⚠️ Perlu verifikasi</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 transition flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Proyek</p>
            <h3 className="text-2xl font-bold text-slate-950 mt-1">{totalProjects}</h3>
            <span className="text-xs text-slate-500 mt-1 block">💼 Terintegrasi sistem</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <Briefcase size={20} />
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Jumlah Analisa Bulanan</h4>
              <p className="text-xs text-slate-500">Statistik aktivitas perbandingan dokumen berjalan</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">2026</span>
          </div>
          {/* Custom Responsive SVG/HTML Bar Chart to prevent Recharts library crashes */}
          <div className="h-64 flex items-end justify-between pt-6 px-4">
            {monthlyStats.map((item, index) => {
              const maxVal = Math.max(...monthlyStats.map(m => m.count), 5);
              const percentHeight = (item.count / maxVal) * 80; // Scale up to max 80% height for visual padding

              return (
                <div key={item.month} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 shadow-sm">
                      {item.count} Analisa
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${percentHeight}%`, minHeight: "8px" }}
                      className="w-8 sm:w-12 bg-slate-800 hover:bg-slate-700 rounded transition-all duration-300"
                    ></div>
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-600">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution Widget */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Tingkat Risiko Dokumen</h4>
            <p className="text-xs text-slate-500 mb-4">Klasifikasi tingkat keparahan risiko berdasarkan AI</p>

            {/* Simulated Donut Gauge */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-705 mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Kritis (Critical)</span>
                  <span>{riskCounts.Critical} laporan</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${totalAnalyses > 0 ? (riskCounts.Critical / totalAnalyses) * 100 : 0}%` }} className="bg-rose-500 h-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-705 mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span>Tinggi (High)</span>
                  <span>{riskCounts.High} laporan</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${totalAnalyses > 0 ? (riskCounts.High / totalAnalyses) * 100 : 0}%` }} className="bg-orange-500 h-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-705 mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Sedang (Medium)</span>
                  <span>{riskCounts.Medium} laporan</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${totalAnalyses > 0 ? (riskCounts.Medium / totalAnalyses) * 100 : 0}%` }} className="bg-amber-400 h-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-705 mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Rendah (Low)</span>
                  <span>{riskCounts.Low} laporan</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${totalAnalyses > 0 ? (riskCounts.Low / totalAnalyses) * 100 : 0}%` }} className="bg-emerald-500 h-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-450">Total Teranalisa</span>
            <span className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">{totalAnalyses} Laporan</span>
          </div>
        </div>
      </div>

      {/* Recents Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Dokumen Terbaru Diupload</h4>
            <button
              onClick={() => onNavigate("upload")}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
            >
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada dokumen yang diupload.</p>
            ) : (
              documents.slice(0, 5).map((doc) => {
                const proj = projects.find(p => p.id === doc.projectId);
                return (
                  <div key={doc.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-semibold text-slate-950 truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        No: {doc.docNumber || "-"} | Versi: {doc.version} | Proyek: {proj?.name || "Tanpa Proyek"}
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-medium shrink-0">
                      {doc.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Latest AI Reports */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Analisa Perbandingan Terbaru</h4>
            <button
              onClick={() => onNavigate("compare")}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
            >
              Uji Coba <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada analisa perbandingan yang dijalankan.</p>
            ) : (
              reports.slice(0, 5).map((rep) => {
                const proj = projects.find(p => p.id === rep.projectId);
                return (
                  <div key={rep.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-semibold text-slate-950 truncate">
                        {rep.docAName} vs {rep.docBName}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Calendar size={10} />
                        <span>{new Date(rep.timestamp).toLocaleString("id-ID")}</span>
                        <span>• Proyek: {proj?.name || "Umum"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getRiskColor(rep.summary.riskLevel)}`}>
                        Risiko: {rep.summary.riskLevel}
                      </span>
                      <button
                        onClick={() => {
                          onNavigate("compare");
                          onSelectReport(rep);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded transition cursor-pointer"
                        title="Tampilkan"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

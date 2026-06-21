import React, { useState, useEffect } from "react";
import { User, Project, Document, ComparisonReport, ActivityLog } from "./types";
import { supabaseDb, testSupabaseConnection } from "./utils/supabase";
import Dashboard from "./components/Dashboard";
import ProjectModule from "./components/ProjectModule";
import UploadModule from "./components/UploadModule";
import ComparisonModule from "./components/ComparisonModule";
import AuditTrail from "./components/AuditTrail";
import Settings from "./components/Settings";
import { 
  Briefcase, FileText, Sparkles, ShieldCheck, Sliders, LayoutDashboard, 
  Bell, Check, HelpCircle, User as UserIcon, AlertTriangle
} from "lucide-react";

// Preseeded Data Generators for seamless instant evaluations
const PRESEEDED_PROJECTS: Project[] = [
  {
    id: "proj_1",
    name: "Pembangunan Trans-Sumatera Seksi 4",
    code: "PRJ-2026-004",
    owner: "Kementerian PUPR",
    contractor: "PT Hutama Karya (Persero)",
    consultant: "PT Indah Karya Consult",
    value: 12500000000,
    startDate: "2026-02-01",
    endDate: "2026-12-31",
    status: "Berjalan"
  },
  {
    id: "proj_2",
    name: "Pemberdayaan Teknologi Air Bersih Desa Mandiri",
    code: "PRJ-2026-009",
    owner: "Dinas Kesehatan Daerah",
    contractor: "PT Mandiri Abadi Engineering",
    consultant: "CV Karya Prima Pengawas",
    value: 500000000,
    startDate: "2026-01-01",
    endDate: "2026-06-30",
    status: "Selesai"
  }
];

const PRESEEDED_DOCUMENTS: Document[] = [
  {
    id: "doc_1",
    projectId: "proj_2",
    name: "Kontrak Master Pengadaan Pipa Air Bersih",
    docNumber: "KONTRAK-2026-09A",
    version: "1.0",
    date: "2026-01-01",
    category: "Kontrak",
    description: "Dokumen kontrak dasar pengadaan pipa PVC dan penyaluran air bersih sirkuit utama.",
    fileSize: "1.2 MB",
    text: `SURAT PERJANJIAN KERJA (KONTRAK SEMENTARA)\nPembangunan Saluran Air Bersih Desa Mandiri\n\nPasal 3: NILAI KONTRAK\nNilai total pengerjaan diputuskan sebesar Rp 500.000.000 (Lima Ratus Juta Rupiah) bersih termasuk pajak.\n\nPasal 5: WAKTU PELAKSANAAN\nPelaksanaan pekerjaan disepakati berjalan selama 180 Hari Kalender sejak diterbitkannya Surat Perintah Kerja.\n\nPasal 9: SANKSI DAN DENDA KETERLAMBATAN\nApabila terjadi keterlambatan penyelesaian fisik akibat kelalaian Kontraktor, maka Kontraktor dikenakan denda sebesar 0.1% (nol koma satu persen) per hari keterlambatan dengan maksimal denda adalah 5% dari total nilai kontrak.\n\nPasal 12: SYARAT PEMBAYARAN\nPembayaran dilakukan dalam tiga tumpukan termin progres hulu:\n1. Uang muka sebesar 20%\n2. Termin kedua setelah progres mencapai 70% sebesar 50%\n3. Pembayaran retensi 5% dibayarkan setelah masa pemeliharaan berakhir 3 bulan.\n\nPasal 15: FORCE MAJEURE\nKeadaan luar biasa di luar kendali menyangkut bencana alam vulkanik, banjir bandang, gempa tektonik berat.`,
    uploadedBy: "Andi Utama (Super Admin)",
    uploadedAt: "2026-01-03T10:00:00.000Z"
  },
  {
    id: "doc_2",
    projectId: "proj_2",
    name: "Addendum Kontrak Pipa Air Bersih - Penyesuaian",
    docNumber: "KONTRAK-2026-09A/ADD-01",
    version: "1.1",
    date: "2026-04-15",
    category: "Addendum",
    description: "Amandemen kontrak mencakup penyesuaian nilai beli bahan baku, denda keterlambatan, dan mempercepat sirkuit jadwal.",
    fileSize: "1.4 MB",
    text: `SURAT PERJANJIAN KERJA (KONTRAK SEBENARNYA - ADDENDUM 1)\nPembangunan Saluran Air Bersih Desa Mandiri\n\nPasal 3: NILAI KONTRAK\nNilai total pengerjaan disesuaikan naik menjadi sebesar Rp 750.000.000 (Tujuh Ratus Lima Puluh Juta Rupiah) bersih termasuk pajak akibat eskalasi harga material pipa PVC HDPE.\n\nPasal 5: WAKTU PELAKSANAAN\nPelaksanaan pekerjaan dipangkas dipercepat berjalan selama 120 Hari Kalender sejak diterbitkannya Surat Perintah Kerja asli agar memenuhi audit triwulan desa.\n\nPasal 9: SANKSI DAN DENDA KETERLAMBATAN\nApabila terjadi keterlambatan penyelesaian fisik akibat kelalaian Kontraktor, maka Kontraktor dikenakan denda keterlambatannya sebesar 0.2% (nol koma dua persen) per hari keterlambatan dengan maksimal denda ditingkatkan menjadi 10% dari total nilai kontrak baru.\n\nPasal 12: SYARAT PEMBAYARAN\nPembayaran dilakukan dalam termin progres berikut:\n1. Uang muka sebesar 20%\n2. Pembayaran progres sisa setelah rampung penuh.\n(Syarat retensi pemeliharaan 5% dibatalkan dan ditiadakan demi menjaga likuiditas lapangan bisnis Kontraktor).\n\nPasal 15: FORCE MAJEURE\nKeadaan luar biasa menyangkut bencana alam berat serta pertimbangan situasi krisis pandemi global dan kebijakan pembatasan wilayah resmi pemerintah.`,
    uploadedBy: "Andi Utama (Super Admin)",
    uploadedAt: "2026-04-16T14:30:00.000Z"
  }
];

const PRESEEDED_LOGS: ActivityLog[] = [
  {
    id: "log_1",
    userEmail: "payrayadev@gmail.com",
    userName: "Andi Utama",
    userRole: "super_admin",
    action: "Sistem Diinisialisasi",
    details: "DocCompare AI merangkum preseeded database proyek demi kelancaran demo.",
    timestamp: "2026-06-20T08:00:00.000Z"
  },
  {
    id: "log_2",
    userEmail: "payrayadev@gmail.com",
    userName: "Andi Utama",
    userRole: "super_admin",
    action: "Unggah Dokumen",
    details: "Mengunggah file Kontrak Master Pengadaan Pipa Air Bersih (v1.0) untuk Proyek Air Bersih.",
    timestamp: "2026-06-20T09:12:00.000Z"
  }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  // Authentication & RBAC Switcher Simulation
  const [usersList] = useState<User[]>([
    { id: "usr_1", name: "Andi Utama", email: "payrayadev@gmail.com", role: "super_admin", subscription: "Enterprise" },
    { id: "usr_2", name: "Budi Santoso", email: "budi.admin@doccompare.ai", role: "admin", subscription: "Pro" },
    { id: "usr_3", name: "Citra Lestari", email: "citra.staff@doccompare.ai", role: "staff", subscription: "Free" }
  ]);
  const [currentUser, setCurrentUser] = useState<User>(usersList[0]);

  // Master State Managers
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("doc_compare_projects");
    return saved ? JSON.parse(saved) : PRESEEDED_PROJECTS;
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem("doc_compare_documents");
    return saved ? JSON.parse(saved) : PRESEEDED_DOCUMENTS;
  });

  const [reports, setReports] = useState<ComparisonReport[]>(() => {
    const saved = localStorage.getItem("doc_compare_reports");
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("doc_compare_logs");
    return saved ? JSON.parse(saved) : PRESEEDED_LOGS;
  });

  // Selected report from dashboard deep-link
  const [selectedReport, setSelectedReport] = useState<ComparisonReport | null>(null);

  // Notification center alerts states
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; message: string; timestamp: string; read: boolean }>>([
    {
      id: "not_1",
      type: "alert",
      message: "Proyek Air Bersih: Escaped nominal dari Rp 500juta ke Rp 750juta diubah oleh Super Admin.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: "not_2",
      type: "warning",
      message: "Denda draf air bersih ditingkatkan 0.1% -> 0.2% per hari keterlambatan.",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Supabase Connection & Synchronization Hook
  const [supabaseStatus, setSupabaseStatus] = useState<string>("Inisialisasi...");

  useEffect(() => {
    async function initSupabase() {
      const conn = await testSupabaseConnection();
      if (conn.success) {
        setSupabaseStatus("🟢 Terhubung");

        // Sync projects
        const dbProjects = await supabaseDb.getProjects();
        if (dbProjects && dbProjects.length > 0) {
          setProjects(dbProjects);
        } else if (dbProjects) {
          // If table exists but empty, seed from PRESEEDED_PROJECTS
          for (const proj of PRESEEDED_PROJECTS) {
            await supabaseDb.saveProject(proj);
          }
        }

        // Sync documents
        const dbDocs = await supabaseDb.getDocuments();
        if (dbDocs && dbDocs.length > 0) {
          setDocuments(dbDocs);
        } else if (dbDocs) {
          for (const doc of PRESEEDED_DOCUMENTS) {
            await supabaseDb.saveDocument(doc);
          }
        }

        // Sync comparison reports
        const dbReports = await supabaseDb.getReports();
        if (dbReports && dbReports.length > 0) {
          setReports(dbReports);
        }

        // Sync activity logs
        const dbLogs = await supabaseDb.getLogs();
        if (dbLogs && dbLogs.length > 0) {
          setLogs(dbLogs);
        } else if (dbLogs) {
          for (const log of PRESEEDED_LOGS) {
            await supabaseDb.saveLog(log);
          }
        }
      } else {
        setSupabaseStatus("🔴 Terputus (Lokal)");
        console.warn("Supabase offline, using local state: ", conn.message);
      }
    }
    initSupabase();
  }, []);

  // Sync state with local storage on adjustments
  useEffect(() => {
    localStorage.setItem("doc_compare_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("doc_compare_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem("doc_compare_reports", JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem("doc_compare_logs", JSON.stringify(logs));
  }, [logs]);

  // Add Log helper
  const addAuditLog = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      userEmail: currentUser.email,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setLogs((prev) => [newLog, ...prev]);
    supabaseDb.saveLog(newLog);
  };

  // Add Notification helper
  const addNotification = (type: string, message: string) => {
    const newNotif = {
      id: "not_" + Math.random().toString(),
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Project Functions
  const handleAddProject = (p: Omit<Project, "id">) => {
    const newProject: Project = {
      id: "proj_" + Math.random().toString(36).substr(2, 9),
      ...p
    };
    setProjects((prev) => [...prev, newProject]);
    addAuditLog("Buat Proyek", `Membuat proyek baru: ${p.name} (Kode: ${p.code})`);
    supabaseDb.saveProject(newProject);
    
    if (p.value > 1000000000) {
      addNotification("info", `Proyek beranggaran jumbo dibuat: ${p.name} senilai Rp ${p.value.toLocaleString()}`);
    }
  };

  const handleUpdateProject = (updated: Project) => {
    const oldProj = projects.find(p => p.id === updated.id);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    addAuditLog("Edit Proyek", `Mengupdate detail proyek: ${updated.name} (${updated.code})`);
    supabaseDb.saveProject(updated);

    // Detect if value or timeline shifted to dispatch smart warnings!
    if (oldProj) {
      if (oldProj.value !== updated.value) {
        addNotification("alert", `⚠️ Nilai Kontrak Proyek [${updated.code}] berubah dari Rp ${oldProj.value.toLocaleString()} ke Rp ${updated.value.toLocaleString()}`);
      }
      if (oldProj.endDate !== updated.endDate) {
        addNotification("warning", `⚠️ Tanggal Selesai Kontrak Proyek [${updated.code}] dipindahkan dari ${oldProj.endDate} ke ${updated.endDate}`);
      }
    }
  };

  const handleDeleteProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      addAuditLog("Hapus Proyek", `Menghapus proyek kerja: ${target.name} (${target.code})`);
      supabaseDb.deleteProject(id);
    }
  };

  // Document Functions
  const handleAddDocument = (d: Omit<Document, "id" | "uploadedBy" | "uploadedAt">) => {
    const newDoc: Document = {
      id: "doc_" + Math.random().toString(36).substr(2, 9),
      ...d,
      uploadedBy: `${currentUser.name} (${currentUser.role === "super_admin" ? "Super Admin" : currentUser.role})`,
      uploadedAt: new Date().toISOString()
    };
    setDocuments((prev) => [...prev, newDoc]);
    addAuditLog("Upload Dokumen", `Mengunggah dokumen ${d.name} (Kategori: ${d.category}, Versi: v${d.version})`);
    addNotification("info", `Dokumen baru diarsip: ${d.name} (Kategori: ${d.category})`);
    supabaseDb.saveDocument(newDoc);
  };

  const handleDeleteDocument = (id: string) => {
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (target) {
      addAuditLog("Hapus Dokumen", `Menghapus arsip dokumen: ${target.name} (v${target.version})`);
      supabaseDb.deleteDocument(id);
    }
  };

  // Reports Save Functions
  const handleSaveReport = (rep: Omit<ComparisonReport, "id" | "timestamp">) => {
    const newReport: ComparisonReport = {
      id: "rep_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...rep
    };
    setReports((prev) => [newReport, ...prev]);
    addAuditLog("Perbandingan AI", `Membandingkan dokumen ${rep.docAName} vs. ${rep.docBName}`);
    supabaseDb.saveReport(newReport);

    // Automatically check for custom notification criteria requested
    const riskIsHigh = ["high", "critical"].includes(rep.summary.riskLevel.toLowerCase());
    if (riskIsHigh) {
      addNotification("alert", `🔥 BAHAYA AI: Risiko ${rep.summary.riskLevel} terdeteksi antara ${rep.docAName} vs ${rep.docBName}!`);
    }

    // Detect if value or timelines changed in changes list
    const hasValueChanges = rep.changes.some(c => c.category.toLowerCase().includes("nilai") || c.category.toLowerCase().includes("nominal"));
    if (hasValueChanges) {
      addNotification("alert", `⚠️ NILAI BERUBAH: Perbedaan nominal keuangan dideteksi oleh AI.`);
    }

    const hasTermChanges = rep.changes.some(c => c.category.toLowerCase().includes("tanggal") || c.category.toLowerCase().includes("jangka") || c.category.toLowerCase().includes("pelaksanaan"));
    if (hasTermChanges) {
      addNotification("warning", `⚠️ JADWAL SHIFT: AI mendeteksi perubahan durasi/jadwal kritis proyek.`);
    }
  };

  // Switch User Profile Control
  const handleSwitchUser = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      addAuditLog("Ganti Profil", `Otoritas login beralih ke: ${target.name} (${target.role})`);
    }
  };

  // Update Subscription Licensing
  const handleUpdateSubscription = (sub: User["subscription"]) => {
    setCurrentUser((prev) => ({ ...prev, subscription: sub }));
    addAuditLog("Ganti Paket", `Paket lisensi perusahaan diperbaharui menjadi: ${sub}`);
    addNotification("info", `Sukses berimigrasi ke Lisensi ${sub}! Layanan dinamis diperluas.`);
  };

  // Clears Audit TrialLogs
  const handleClearLogs = () => {
    setLogs([]);
    addAuditLog("Bersihkan Audit", "Seluruh riwayat audit trail dihapus secara manual.");
    supabaseDb.clearLogs();
  };

  const getUnreadNotifCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  const markAllNotifAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* Dynamic Header Navbar Layout */}
      <header className="bg-white h-16 px-6 flex items-center justify-between border-b border-slate-200 relative z-30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">DocCompare AI</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Enterprise Document Audit Platform</p>
          </div>
        </div>

        {/* Right side notification and avatar panel */}
        <div className="flex items-center gap-4">
          
          {/* Notification dropdown icon */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                if (!isNotifOpen) markAllNotifAsRead();
              }}
              className="p-1.5 hover:bg-slate-50 rounded-lg transition relative text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <Bell size={18} />
              {getUnreadNotifCount() > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>

            {/* Notification alert floating card */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-250 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notifikasi Sistem</span>
                  <button 
                    onClick={() => {
                      setNotifications([]);
                      setIsNotifOpen(false);
                    }}
                    className="text-[9px] text-red-600 hover:underline cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Tidak ada notifikasi baru.</p>
                  ) : (
                    notifications.map((not) => (
                      <div key={not.id} className={`p-3 text-[11px] leading-relaxed flex gap-2 ${not.read ? "bg-white" : "bg-slate-50/50"}`}>
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={13} />
                        <div>
                          <p className="text-slate-700 font-medium">{not.message}</p>
                          <span className="text-[9px] text-slate-400 block mt-1">
                            {new Date(not.timestamp).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User badge detail */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-800">{currentUser.name}</p>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{currentUser.role.replace("_", " ")}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-sm">
              {currentUser.name[0]}
            </div>
          </div>
        </div>
      </header>

      {/* Main Structural Body */}
      <div className="flex-1 flex flex-col md:flex-row relative z-15">
        
        {/* Navigation Sidebar Drawer */}
        <aside className="w-full md:w-64 bg-white text-slate-600 border-r border-slate-200 flex flex-col py-5 justify-between">
          <div className="space-y-1.5 px-4">
            <button
              onClick={() => setCurrentTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === "dashboard"
                  ? "bg-slate-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard size={16} /> Panel Utama (Dashboard)
            </button>

            <button
              onClick={() => setCurrentTab("projects")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === "projects"
                  ? "bg-slate-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Briefcase size={16} /> Daftar Proyek Kerja
            </button>

            <button
              onClick={() => setCurrentTab("upload")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === "upload"
                  ? "bg-slate-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <FileText size={16} /> Unggah & Arsip Dokumen
            </button>

            <button
              onClick={() => setCurrentTab("compare")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === "compare"
                  ? "bg-slate-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Sparkles size={16} /> Bandingkan Dokumen AI
            </button>

            <button
              onClick={() => setCurrentTab("audit")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === "audit"
                  ? "bg-slate-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={16} /> Log Keamanan (Audit Trail)
            </button>

            <button
              onClick={() => setCurrentTab("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === "settings"
                  ? "bg-slate-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Sliders size={16} /> Pengaturan Panel
            </button>
          </div>

          {/* Bottom user system meta block */}
          <div className="space-y-4">
            <div className="px-4 mx-3">
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg">
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mb-1">{currentUser.subscription} PLAN</p>
                <p className="text-[11px] text-slate-500 leading-tight">84% of 500 documents analyzed this month.</p>
              </div>
            </div>
            <div className="px-6 border-t border-slate-100 pt-4 text-[10px] space-y-1.5 text-slate-400">
              <p className="flex items-center gap-1">
                SYSTEM HEALTH: <span className="font-bold text-emerald-600">🟢 LIVE</span>
              </p>
              <p className="flex items-center gap-1">
                DATABASE: <span className="font-bold uppercase bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200">Supabase</span>
              </p>
              <p className="flex items-center gap-1">
                STATUS: <span className="font-bold">{supabaseStatus}</span>
              </p>
              <p>© 2026 DocCompare AI</p>
            </div>
          </div>
        </aside>

        {/* Content Viewer viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {currentTab === "dashboard" && (
            <Dashboard
              projects={projects}
              documents={documents}
              reports={reports}
              onNavigate={(tab) => {
                setCurrentTab(tab);
              }}
              onSelectReport={(rep) => {
                setSelectedReport(rep);
              }}
            />
          )}

          {currentTab === "projects" && (
            <ProjectModule
              projects={projects}
              currentUserRole={currentUser.role}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {currentTab === "upload" && (
            <UploadModule
              projects={projects}
              documents={documents}
              currentUserRole={currentUser.role}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {currentTab === "compare" && (
            <ComparisonModule
              projects={projects}
              documents={documents}
              reports={reports}
              currentUserRole={currentUser.role}
              selectedReportFromDashboard={selectedReport}
              onClearSelectedReport={() => setSelectedReport(null)}
              onSaveReport={handleSaveReport}
            />
          )}

          {currentTab === "audit" && (
            <AuditTrail
              logs={logs}
              onClearLogs={handleClearLogs}
            />
          )}

          {currentTab === "settings" && (
            <Settings
              currentUser={currentUser}
              usersList={usersList}
              onSwitchUser={handleSwitchUser}
              onUpdateSubscription={handleUpdateSubscription}
            />
          )}
        </main>
      </div>
    </div>
  );
}

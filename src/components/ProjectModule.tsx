import React, { useState } from "react";
import { Project, UserRole } from "../types";
import { Plus, Edit, Briefcase, Calendar, DollarSign, Search, CheckCircle, Clock, AlertTriangle, AlertCircle } from "lucide-react";

interface ProjectModuleProps {
  projects: Project[];
  currentUserRole: UserRole;
  onAddProject: (project: Omit<Project, "id">) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectModule({
  projects,
  currentUserRole,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectModuleProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  
  // Modal controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [owner, setOwner] = useState("");
  const [contractor, setContractor] = useState("");
  const [consultant, setConsultant] = useState("");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"Persiapan" | "Berjalan" | "Selesai" | "Ditunda">("Persiapan");

  const isReadOnly = currentUserRole === "staff";

  const handleOpenAddModal = () => {
    if (isReadOnly) return;
    setEditingProject(null);
    setName("");
    setCode("");
    setOwner("");
    setContractor("");
    setConsultant("");
    setValue("");
    setStartDate("");
    setEndDate("");
    setStatus("Persiapan");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    if (isReadOnly) return;
    setEditingProject(proj);
    setName(proj.name);
    setCode(proj.code);
    setOwner(proj.owner);
    setContractor(proj.contractor);
    setConsultant(proj.consultant);
    setValue(proj.value.toString());
    setStartDate(proj.startDate);
    setEndDate(proj.endDate);
    setStatus(proj.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!name || !code) {
      alert("Nama Proyek dan Kode Proyek wajib diisi.");
      return;
    }

    const payload = {
      name,
      code,
      owner,
      contractor,
      consultant,
      value: parseFloat(value) || 0,
      startDate,
      endDate,
      status,
    };

    if (editingProject) {
      onUpdateProject({ id: editingProject.id, ...payload });
    } else {
      onAddProject(payload);
    }
    setIsModalOpen(false);
  };

  // Filter projects list
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(search.toLowerCase()) ||
      proj.code.toLowerCase().includes(search.toLowerCase()) ||
      proj.owner.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "All" || proj.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case "Selesai":
        return (
          <span className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <CheckCircle size={10} /> Selesai
          </span>
        );
      case "Berjalan":
        return (
          <span className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <Clock size={10} /> Berjalan
          </span>
        );
      case "Ditunda":
        return (
          <span className="flex items-center gap-1 text-[9px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <AlertCircle size={10} /> Ditunda
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <Calendar size={10} /> Persiapan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Manajemen Proyek Kerja</h2>
          <p className="text-xs text-slate-500">Kelola daftar portofolio, masa kerja, dan detail nilai kontrak terdaftar.</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus size={16} /> Tambah Proyek Baru
          </button>
        )}
      </div>

      {/* Workspace search & filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, kode, atau pemilik proyek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg text-xs outline-none transition text-slate-800"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg text-xs outline-none text-slate-700 transition cursor-pointer"
          >
            <option value="All">Semua Status</option>
            <option value="Persiapan">Persiapan</option>
            <option value="Berjalan">Berjalan</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditunda">Ditunda</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-slate-250 rounded-xl py-12 text-center">
            <Briefcase size={32} className="mx-auto text-slate-300" />
            <p className="text-xs text-slate-400 mt-2">Tidak ditemukan proyek yang cocok dengan filter Anda.</p>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-350 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold bg-slate-105 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                    {proj.code}
                  </span>
                  {getStatusBadge(proj.status)}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 mt-3 hover:text-blue-600 truncate" title={proj.name}>
                  {proj.name}
                </h3>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pemilik:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">{proj.owner || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kontraktor:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">{proj.contractor || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Konsultan:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">{proj.consultant || "-"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                    <span className="text-slate-405 flex items-center gap-1">
                      <DollarSign size={13} /> Nilai Kontrak:
                    </span>
                    <span className="font-bold text-slate-900">{formatCurrency(proj.value)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-5 pt-3 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>
                    {proj.startDate || "?"} &mdash; {proj.endDate || "?"}
                  </span>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => handleOpenEditModal(proj)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 py-1 px-2 hover:bg-slate-50 rounded transition cursor-pointer"
                  >
                    <Edit size={12} /> Edit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                {editingProject ? `Ubah Proyek: ${editingProject.code}` : "Tambah Proyek Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Nama Proyek *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Pembangunan Jaringan Distribusi Air Bersih"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Kode Proyek *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: PRJ-2026-009"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Nilai Kontrak (Rupiah)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Contoh: 1500000000"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Pemilik Proyek (Owner)
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Contoh: Dinas Pekerjaan Umum"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Kontraktor Pelaksana
                  </label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    placeholder="Contoh: PT Hutama Karya Swasta"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-800 transition"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Konsultan Pengawas
                  </label>
                  <input
                    type="text"
                    value={consultant}
                    onChange={(e) => setConsultant(e.target.value)}
                    placeholder="Contoh: CV Rekayasa Pratama"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tanggal Mulai Kerja
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-850 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tanggal Selesai Kerja
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-850 transition"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Status Proyek
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none transition text-slate-750 bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="Persiapan">Persiapan (Drafting)</option>
                    <option value="Berjalan">Berjalan (Underway)</option>
                    <option value="Selesai">Selesai (Completed)</option>
                    <option value="Ditunda">Ditunda (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 rounded-lg text-xs text-slate-500 cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

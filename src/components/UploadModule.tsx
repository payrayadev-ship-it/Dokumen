import React, { useState, useRef } from "react";
import { Project, Document, UserRole } from "../types";
import { Upload, File, HelpCircle, Eye, Trash2, Search, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { extractDocumentText } from "../utils/documentParser";

interface UploadModuleProps {
  projects: Project[];
  documents: Document[];
  currentUserRole: UserRole;
  onAddDocument: (doc: Omit<Document, "id" | "uploadedBy" | "uploadedAt">) => void;
  onDeleteDocument: (id: string) => void;
}

export default function UploadModule({
  projects,
  documents,
  currentUserRole,
  onAddDocument,
  onDeleteDocument,
}: UploadModuleProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "");
  const [name, setName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [version, setVersion] = useState("1.0");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<Document["category"]>("Kontrak");
  const [description, setDescription] = useState("");
  
  // File processing states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const isReadOnly = currentUserRole === "staff" ? false : false; // Staff is authorized to upload as per roles rule

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    // 200MB limit checker (200 * 1024 * 1024)
    const limit = 200 * 1024 * 1024;
    if (file.size > limit) {
      setProcessError("File melebihi batas ukuran maksimal 200 MB.");
      return;
    }

    setSelectedFile(file);
    setProcessError("");
    setIsProcessing(true);
    
    // Autofill name from file if empty
    if (!name) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setName(cleanName);
    }

    try {
      const text = await extractDocumentText(file);
      setExtractedText(text);
      if (!text.trim()) {
        setProcessError("Peringatan: Berhasil diekstrak namun dokumen tidak mengandung teks berharga.");
      }
    } catch (err: any) {
      console.error(err);
      setProcessError(`Gagal mengekstrak dokumen otomatis: ${err.message}. Hubungkan file manual/pilih format teks.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert("Pilih proyek target terlebih dahulu.");
      return;
    }
    if (!extractedText && !processError) {
      alert("Harap pilih file dokumen atau tunggu ekstraksi selesai.");
      return;
    }

    const fileSizeString = selectedFile 
      ? (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB" 
      : "Unknown";

    onAddDocument({
      projectId: selectedProjectId,
      name,
      docNumber,
      version,
      date,
      category,
      description,
      text: extractedText || `[Backup Data Content]\nNo text parsed from file. Name: ${name}`,
      fileSize: fileSizeString,
    });

    // Reset Form
    setName("");
    setDocNumber("");
    setVersion("1.0");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedFile(null);
    setExtractedText("");
    setDescription("");
    setProcessError("");
  };

  // Filter lists
  const filteredDocs = documents.filter((doc) => {
    const proj = projects.find(p => p.id === doc.projectId);
    const matchesSearch = 
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.docNumber && doc.docNumber.toLowerCase().includes(search.toLowerCase())) ||
      (proj && proj.name.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = filterCategory === "All" || doc.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Modul Unggah & Database Dokumen</h2>
        <p className="text-xs text-slate-500">
          Dukung format PDF, DOCX, XLSX, dan TXT dengan sistem ekstraksi teks instan untuk perbandingan otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-fit">
          <h3 className="font-semibold text-xs text-slate-900 tracking-wider uppercase mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Upload size={14} className="text-blue-600" /> Registrasi Dokumen Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Target Proyek Kerja *</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg text-xs outline-none cursor-pointer text-slate-800"
                required
              >
                <option value="">-- Pilih Proyek Terkait --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Canvas */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">File Dokumen (Maks. 200MB) *</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col justify-center items-center ${
                  dragActive 
                    ? "border-blue-600 bg-blue-50/20" 
                    : selectedFile 
                    ? "border-emerald-500 bg-emerald-50/10" 
                    : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/30"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileInputChange}
                  accept=".pdf,.docx,.xlsx,.xls,.txt"
                  className="hidden"
                />
                <File 
                  className={`mx-auto mb-2 ${selectedFile ? "text-emerald-500" : "text-slate-400"}`} 
                  size={24} 
                />
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-450">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Tarik & lepas file di sini, atau klik untuk memilih</p>
                    <p className="text-[10px] text-slate-400 mt-1">Mendukung PDF, DOCX, XLSX, TXT</p>
                  </div>
                )}
              </div>
            </div>

            {/* Processing State Anim */}
            {isProcessing && (
              <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-blue-600" />
                <span>Mengekstrak teks dokumen secara otomatis...</span>
              </div>
            )}

            {processError && (
              <div className="bg-amber-50 text-amber-950 px-3 py-2 border border-amber-100 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span>{processError}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Dokumen *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Amandemen Perpanjangan Kontrak"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-850 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nomor Dokumen</label>
                  <input
                    type="text"
                    placeholder="Contoh: SPK-990-PU"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-850 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Versi Dokumen</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1.1 / Rev.2"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-850 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Terbit</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-850 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kategori Dokumen</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none cursor-pointer bg-slate-50 focus:bg-white text-slate-750 transition"
                  >
                    <option value="Kontrak">Kontrak</option>
                    <option value="Addendum">Addendum</option>
                    <option value="BOQ">BOQ</option>
                    <option value="RAB">RAB</option>
                    <option value="Tender">Tender</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Surat">Surat</option>
                    <option value="SOP">SOP</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Keterangan / Deskripsi</label>
                <textarea
                  placeholder="Keterangan singkat substansi dokumen..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-slate-500 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-850 transition"
                />
              </div>

              {extractedText && (
                <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg">
                  <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                    🟢 Teks berhasil ditampung ({extractedText.length} karakter)
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing || (!extractedText && !name)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs py-2.5 rounded-lg transition mt-2 cursor-pointer"
            >
              Simpan Dokumen ke Sistem
            </button>
          </form>
        </div>

        {/* Catalog List Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-xs text-slate-900 tracking-wider uppercase">Arsip & Pustaka Dokumen</h3>
            
            {/* Search/Filter UI */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
                <input
                  type="text"
                  placeholder="Cari arsip..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg text-[10px] outline-none text-slate-750 transition"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg text-[10px] outline-none text-slate-600 cursor-pointer"
              >
                <option value="All">Semua Kategori</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Addendum">Addendum</option>
                <option value="BOQ">BOQ</option>
                <option value="RAB">RAB</option>
                <option value="Tender">Tender</option>
                <option value="Invoice">Invoice</option>
                <option value="Surat">Surat</option>
                <option value="SOP">SOP</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Nama Dokumen</th>
                  <th className="px-4 py-3">No. / Versi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Proyek</th>
                  <th className="px-4 py-3">Ukuran</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada dokumen yang terdaftar. Unggah dokumen pertama Anda di panel kiri.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const linkedProj = projects.find((p) => p.id === doc.projectId);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">Terbit: {doc.date}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-slate-800">{doc.docNumber || "-"}</p>
                          <p className="text-[10px] font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded w-fit mt-0.5 text-slate-500">
                            v{doc.version}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="truncate max-w-[120px] text-slate-600 font-medium bg-slate-50 border border-slate-150 p-1 rounded text-[10px]">
                            {linkedProj?.name || "Tersendiri"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono text-[10px]">{doc.fileSize || "Manual"}</td>
                        <td className="px-4 py-3.5 text-right flex justify-end gap-1.5 mt-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1 px-2.5 text-[10px] text-slate-700 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded transition cursor-pointer flex items-center gap-1"
                            title="Tinjau Isi Teks"
                          >
                            <Eye size={12} /> Tinjau
                          </button>
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Show Preview Content Dialog */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-slate-105 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Kategori: {previewDoc.category}
                </span>
                <h3 className="font-bold text-xs text-slate-900 mt-1.5">{previewDoc.name}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
            {/* Scrollable text visualizer */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed">
              <div className="border-b border-slate-800 pb-3 mb-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                NO: {previewDoc.docNumber || "-"} | VERSI: {previewDoc.version} | DITERBITKAN: {previewDoc.date} | DIUPLOAD OLEH: {previewDoc.uploadedBy}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-slate-200">{previewDoc.text}</pre>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Kombinasi Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

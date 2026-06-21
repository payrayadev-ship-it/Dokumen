import React, { useState } from "react";
import { ActivityLog } from "../types";
import { ShieldAlert, Search, ClipboardList, Trash } from "lucide-react";

interface AuditTrailProps {
  logs: ActivityLog[];
  onClearLogs?: () => void;
}

export default function AuditTrail({ logs, onClearLogs }: AuditTrailProps) {
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((log) => {
    return (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.userRole.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Super Admin</span>;
      case "admin":
        return <span className="text-[10px] bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Admin</span>;
      default:
        return <span className="text-[10px] bg-slate-50 text-slate-400 border border-slate-150 px-2 py-0.5 rounded uppercase tracking-wide">Staf</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-rose-600" /> Log Kepatuhan & Keamanan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Jejak rekaman aktivitas pengguna, penambahan proyek, komparasi dokumen, dan mutasi data riwayat lengkap.
          </p>
        </div>
        {onClearLogs && logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs px-4 py-2 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash size={12} /> Bersihkan Riwayat Audit
          </button>
        )}
      </div>

      {/* Query Search filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Cari kata kunci tindakan log, nama staf, rincian, atau role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-slate-500 focus:bg-white rounded-lg text-xs outline-none transition text-slate-800"
          />
        </div>
      </div>

      {/* Audit ledger list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Waktu Kejadian</th>
                <th className="px-6 py-4">Nama / Pengguna</th>
                <th className="px-6 py-4">Otoritas</th>
                <th className="px-6 py-4">Tindakan / Aksi</th>
                <th className="px-6 py-4">Rincian Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <ClipboardList size={24} className="mx-auto mb-2 text-slate-300" />
                    Belum ada rekaman aktivitas yang terdata.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/20 transition">
                    <td className="px-6 py-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{log.userName}</p>
                      <p className="text-[10px] text-slate-400">{log.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(log.userRole)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-850">{log.action}</td>
                    <td className="px-6 py-4 text-slate-600 leading-relaxed font-sans">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

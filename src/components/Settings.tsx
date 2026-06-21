import React from "react";
import { User, UserRole } from "../types";
import { Users, CreditCard, Shield, Sliders, Database, Check, Cpu, AlertCircle } from "lucide-react";

interface SettingsProps {
  currentUser: User;
  usersList: { id: string; name: string; email: string; role: UserRole; subscription: User["subscription"] }[];
  onSwitchUser: (userId: string) => void;
  onUpdateSubscription: (sub: User["subscription"]) => void;
}

export default function Settings({
  currentUser,
  usersList,
  onSwitchUser,
  onUpdateSubscription,
}: SettingsProps) {
  const isSuperAdminOnly = currentUser.role === "super_admin";

  const subscriptionTiers = [
    {
      name: "Free",
      price: "Rp 0 / bln",
      desc: "Untuk penggunaan individu pemula",
      features: ["Max 10 Dokumen / bln", "Analisa Standar AI", "Batas ukuran file 10MB", "Side-by-Side Visualizer"],
    },
    {
      name: "Pro",
      price: "Rp 1.490.000 / bln",
      desc: "Untuk badan usaha menengah dan analis kontrak",
      features: [
        "Satu Proyek Tanpa Batas Dokumen",
        "Pemodelan Analisa Risiko Terpadu AI",
        "Batas ukuran file 100MB",
        "Ekspor Excel & Word",
        "Prioritas Gemini 3.5 Flash",
      ],
    },
    {
      name: "Enterprise",
      price: "Rp 4.900.000 / bln",
      desc: "Solusi terenkripsi korporat & multinasional",
      features: [
        "Akses Multi-proyek & Multi-staf",
        "Pemodelan Risiko Kustom Gemini Pro",
        "Batas ukuran file 200MB (Maksimum)",
        "Audit Trail & Log Kepatuhan",
        "Pencatatan Otomatis & Support SLA",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
          <Sliders size={16} className="text-slate-700" /> Konfigurasi Sistem & Pengaturan
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Ubah profil login simulasi, paket lisensi, backup cloud, tingkat keamanan enkripsi, dan integrasi API Key.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Switcher Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 lg:col-span-1">
          <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Users size={14} className="text-slate-700" /> Profil simulator (RBAC)
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Pilihlah akun simulasi di bawah untuk menguji perizinan kontrol (Role-Based Access Control) antara Super Admin, Admin, dan Staf.
          </p>

          <div className="space-y-3 pt-1">
            {usersList.map((usr) => {
              const isCurrent = usr.id === currentUser.id;
              return (
                <div
                  key={usr.id}
                  onClick={() => onSwitchUser(usr.id)}
                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                    isCurrent 
                      ? "border-slate-850 bg-slate-50" 
                      : "border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-900">{usr.name}</p>
                    <p className="text-[10px] text-slate-400">{usr.email}</p>
                    <div className="flex gap-1.5 pt-1">
                      <span className="text-[9px] bg-slate-105 text-slate-700 font-bold px-1.5 py-0.2 rounded border border-slate-200 uppercase tracking-wider">
                        {usr.role.replace("_", " ")}
                      </span>
                      <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                        Plan: {usr.subscription}
                      </span>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="bg-slate-900 text-white p-1 rounded-full border border-slate-950">
                      <Check size={10} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* System & Protection Specs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Shield size={14} className="text-slate-700" /> Sinyal & Keamanan Komputasi Cloud (Enkripsi)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Model Kecerdasan Buatan</span>
              <p className="font-bold text-slate-850 flex items-center gap-1">
                <Cpu size={14} className="text-slate-600" /> Gemini 3.5 Flash (Latest)
              </p>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Terbuka secara server-side melalui proxy sandboxed SDK.</p>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Metode Perlindungan</span>
              <p className="font-bold text-slate-850 flex items-center gap-1">
                <Database size={14} className="text-slate-600" /> Enkripsi AES-256 GCM
              </p>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">File diproses sementara & terlindung enkripsi lokal.</p>
            </div>

            <div className="border border-slate-200 p-3.5 rounded-lg bg-slate-50/50 text-xs space-y-1 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Integrasi API Key</span>
              <p className="font-semibold text-slate-800 leading-relaxed mt-1.5">
                Kunci API Gemini tersimpan aman di <strong className="text-slate-900 bg-slate-200 px-1 border border-slate-250 rounded">Settings &gt; Secrets</strong>.
              </p>
              <p className="text-[10px] text-slate-400 leading-tight mt-1">
                Sistem mendeteksi API Key secara adaptif. Jika API Key belum terpasang atau bernilai default, sistem secara aman menjalankan *Simulative AI Mock* berkinerja tinggi sehingga andal untuk pengujian presentasi.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Cadangan Backup Otomatis & Audit Trail</h4>
            <p className="text-[11px] text-slate-405 leading-relaxed">
              Seluruh rekam jejak audit trail (Audit Trail logger) dicatat secara terdesentralisasi ke metadata. Cadangan dokumen lama didukung penuh sistem redundansi.
            </p>
            <div className="p-2 border border-emerald-200 bg-emerald-50/50 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wider w-fit px-3 py-1">
              🟢 Layanan Sinkronisasi Cloud: AKTIF SINKRONISASI
            </div>
          </div>
        </div>
      </div>

      {/* Subscription licensing packages section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <CreditCard size={14} className="text-slate-700" /> Paket Langganan Perusahaan (Enterprise Subscriptions)
        </h3>
        
        {!isSuperAdminOnly && (
          <div className="bg-amber-50 text-amber-950 p-3.5 border border-amber-200 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <span>
              Hanya akun bersignatur <strong>Super Admin</strong> yang diizinkan untuk mengubah paket langganan perusahaan. Akun Anda saat ini ({currentUser.name}) adalah <strong>{currentUser.role.replace("_", " ")}</strong>.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {subscriptionTiers.map((tier) => {
            const isCurrentTier = currentUser.subscription === tier.name;
            return (
              <div
                key={tier.name}
                className={`border rounded-xl p-5 space-y-4 relative flex flex-col justify-between transition ${
                  isCurrentTier 
                    ? "border-slate-850 bg-slate-50/40 ring-1 ring-slate-200" 
                    : "border-slate-200 hover:bg-slate-50/30"
                }`}
              >
                {isCurrentTier && (
                  <span className="absolute top-0 right-5 -translate-y-1/2 bg-slate-900 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                    Aktif Saat Ini
                  </span>
                )}

                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-widest">{tier.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tier.desc}</p>
                  <p className="text-base font-bold text-slate-850 mt-3">{tier.price}</p>

                  <ul className="mt-4 space-y-2 border-t border-slate-105 pt-3 text-[11px] text-slate-500">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-1.5 leading-tight">
                        <Check size={12} className="text-slate-700 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={!isSuperAdminOnly || isCurrentTier}
                  onClick={() => onUpdateSubscription(tier.name as any)}
                  className={`w-full py-2 rounded-lg text-xs font-bold mt-5 transition cursor-pointer ${
                    isCurrentTier
                      ? "bg-slate-105 text-slate-800 font-bold border border-slate-250"
                      : isSuperAdminOnly
                      ? "bg-slate-900 hover:bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isCurrentTier ? "Paket Aktif" : "Beralih ke Paket Ini"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

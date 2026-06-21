import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to check for Gemini API key
const hasGeminiKey = () => {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY.trim() !== "";
};

// Main comparison API endpoint via Gemini
app.post("/api/compare", async (req, res) => {
  const { docAName, docBName, docAText, docBText, category, fileType } = req.body;

  if (!docAText || !docBText) {
    return res.status(400).json({ error: "Teks Dokumen A dan B harus disediakan." });
  }

  // Fallback Mock Data generation if no Gemini API Key is configured
  if (!hasGeminiKey()) {
    console.warn("GEMINI_API_KEY is not configured or placeholder. Running in Mock Mode.");
    
    // Generate some interesting category-based mock differences
    const isSOP = category?.toLowerCase() === "sop";
    const isContract = ["kontrak", "addendum", "tender"].includes(category?.toLowerCase());
    const isFinance = ["boq", "rab", "invoice"].includes(category?.toLowerCase());

    const totalChanges = 8;
    const added = 3;
    const deleted = 1;
    const modified = 4;
    const riskLevel = isContract ? "High" : isSOP ? "Medium" : "Low";

    const changes = [
      {
        type: "modified",
        category: isContract ? "Klausula Denda Keterlambatan" : isSOP ? "Langkah Prosedur Kerja" : "Total Nominal",
        oldValue: isContract ? "Denda sebesar 0.1% per hari maksimal 5% dari nilai kontrak." : isSOP ? "Masukan log secara manual setiap akhir shift." : "Rp 500.000.000",
        newValue: isContract ? "Denda sebesar 0.2% per hari maksimal 10% dari nilai kontrak." : isSOP ? "Input log real-time menggunakan komputer tablet sebelum meninggalkan area." : "Rp 750.000.000",
        risk: isContract ? "High" : "Medium"
      },
      {
        type: "added",
        category: "Klausul Force Majeure Tambahan",
        oldValue: "-",
        newValue: "Pertimbangan situasi krisis pandemi global dan kebijakan pembatasan wilayah resmi pemerintah.",
        risk: "Low"
      },
      {
        type: "modified",
        category: "Masa Pelaksanaan",
        oldValue: "180 Hari Kalender",
        newValue: "120 Hari Kalender",
        risk: "High"
      },
      {
        type: "deleted",
        category: "Syarat Pembayaran Tahap 3",
        oldValue: "Retensi 5% dibayarkan setelah masa pemeliharaan berakhir 3 bulan.",
        newValue: "-",
        risk: "Medium"
      }
    ];

    const recommendations = [
      "Perhatikan peningkatan denda keterlambatan menjadi 0.2% per hari, negosiasikan kembali agar maksimal tetap 5%.",
      "Perubahan masa pelaksanaan menjadi 120 hari memerlukan percepatan sumber daya staf di lapangan.",
      "Klausul force majeure baru sudah cukup baik melindungi hak-hak operasional.",
      "Lakukan verifikasi mengapa syarat retensi pembayaran draf 3 dihapus sepenuhnya."
    ];

    return res.json({
      isMock: true,
      summary: {
        totalChanges,
        added,
        deleted,
        modified,
        riskLevel
      },
      changes,
      recommendations,
      executiveSummary: `Dokumen \"${docBName || "Baru"}\" merupakan pemutahiran dari Dokumen \"${docAName || "Lama"}\" dalam kategori ${category || "Umum"}. Analisa menunjukkan adanya peningkatan denda keterlambatan serta pemangkasan waktu pelaksanaan kontrak yang signifikan.`,
      importantChanges: "Perubahan krusial meliputi peningkatan denda keterlambatan (0.1% -> 0.2%), penghapusan draf penahanan pembayaran retensi, dan pemotongan durasi proyek dari 180 hari menjadi 120 hari.",
      contractRisks: "Risiko utama terletak pada pengurangan waktu pelaksanaan kontraktor yang dapat memicu pinalti denda harian yang berlipat ganda dari kesepakatan sebelumnya.",
      financialRisks: "Peningkatan nilai keseluruhan (dari Rp 500 juta ke Rp 750 juta) menguntungkan secara nominal nilai kontrak, namun margin profitabilitas terancam jika denda keterlambatan diberlakukan penuh akibat keterbatasan jadwal.",
      scheduleRisks: "Pemangkasan jadwal sebesar 60 hari membutuhkan optimasi proses supply chain material dan lembur tenaga kerja terstruktur.",
      legalRisks: "Absennya draf klausul retensi pemeliharaan 5% dapat membatalkan jaminan perbaikan setelah proyek selesai diserahkan secara hukum.",
      operationalRisks: "Pekerja harus beradaptasi dengan jadwal padat dan pelaporan status harian progres secara real-time demi transparansi.",
      recommendationActions: "1. Hubungi prinsipal hukum proyek untuk meninjau ulang klausul denda 0.2%.\n2. Ajukan revisi draf jadwal ke setidaknya 150 hari kerja.\n3. Pertahankan retensi 5% sebagai retensi jaminan kualitas pekerjaan kontraktor."
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `Anda adalah sistem analisa perbedaan dokumen enterprise-grade berbasis AI yang presisi.
Tugas Anda adalah membandingkan naskah/konten teks Dokumen Lama (A) dengan Dokumen Baru (B).
Deteksi semua perubahan (Penambahan, Penghapusan, Perubahan Nominal, Angka, Tanggal, Nama, Pasal, Harga Satuan, Lingkup, Denda, dll.).

Anda HARUS mengembalikan respons dalam format JSON murni mengikuti skema ini secara presisi tanpa markdown block tambahan selain JSON yang valid:
{
  "summary": {
    "totalChanges": <number>,
    "added": <number>,
    "deleted": <number>,
    "modified": <number>,
    "riskLevel": "Low" | "Medium" | "High" | "Critical"
  },
  "changes": [
    {
      "type": "added" | "deleted" | "modified",
      "category": "<kategori_seperti_Nilai_Kontrak_or_Pasal_1_or_SOP>",
      "oldValue": "<isi_lama_atau_tanda_minus_jika_baru>",
      "newValue": "<isi_baru_atau_tanda_minus_jika_dihapus>",
      "risk": "Low" | "Medium" | "High" | "Critical"
    }
  ],
  "recommendations": [
    "<rekomendasi_tindakan_string_1>",
    "<rekomendasi_tindakan_string_2>"
  ],
  "executiveSummary": "<ringkasan_eksekutif_analisa_dokumen_A_vs_B>",
  "importantChanges": "<perubahan_penting_yang_sangat_berdampak>",
  "contractRisks": "<analisa_risiko_kontrak_lengkap>",
  "financialRisks": "<analisa_risiko_keuangan_nominal_biaya>",
  "scheduleRisks": "<analisa_risiko_jadwal_durasi_proyek>",
  "legalRisks": "<analisa_risiko_hukum_klausul_legalitas>",
  "operationalRisks": "<analisa_risiko_operasional_tim_teknis>",
  "recommendationActions": "<rekomendasi_tindakan_detail_konkrit_beberapa_poin>"
}

Kategori dokumen pembanding adalah: ${category || "Umum"}.
Tolong lakukan ekstraksi perbedaan se-detail mungkin dan tentukan level risiko (riskLevel) secara proporsional.`;

    const userPrompt = `DOKUMEN LAMA (A):\n${docAText}\n\nDOKUMEN BARU (B):\n${docBText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    let resultText = response.text || "";
    // Clean up markdown brackets if generated despite responseMimeType
    if (resultText.startsWith("```json")) {
      resultText = resultText.substring(7);
    }
    if (resultText.endsWith("```")) {
      resultText = resultText.substring(0, resultText.length - 3);
    }
    
    const parsedData = JSON.parse(resultText.trim());
    return res.json({ isMock: false, ...parsedData });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Gagal memproses analisa dengan AI", details: error.message });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DocCompare AI] Server running on http://localhost:${PORT}`);
  });
}

startServer();

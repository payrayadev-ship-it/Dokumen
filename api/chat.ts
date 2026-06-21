import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, documentName, documentText, category } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Isi pesan percakapan harus disertakan." });
  }

  const hasGeminiKey = () => {
    return !!process.env.GEMINI_API_KEY && 
           process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && 
           process.env.GEMINI_API_KEY.trim() !== "";
  };

  // Mock Mode Response
  if (!hasGeminiKey()) {
    console.warn("GEMINI_API_KEY is not configured or placeholder in Serverless handler. Running in Mock Mode.");
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    let mockReply = "";
    const lowerMessage = lastUserMessage.toLowerCase();

    if (documentText) {
      if (lowerMessage.includes("ringkas") || lowerMessage.includes("summary")) {
        mockReply = `**Ringkasan Analisa AI untuk Dokumen *${documentName}*:**\n\n1. **Kategori Dokumen**: ${category || "Umum"}\n2. **Isi Inti**: Dokumen memuat klausul-klausul pengadaan utama termasuk denda harian, nilai pengerjaan, dan durasi proyek.\n3. **Rekomendasi Utama**: Harap memperhatikan klausul denda harian dan jadwal pelaksanaan yang sangat ketat untuk meminimalkan risiko kerugian teknis.`;
      } else if (lowerMessage.includes("risiko") || lowerMessage.includes("risk")) {
        mockReply = `**Analisa Kerentanan Risiko AI untuk *${documentName}*:**\n\n* **Risiko Finansial**: Peningkatan nilai beli bahan baku berpotensi memotong kelayakan margin proyek jika tidak dikompensasi jadwal yang fleksibel.\n* **Risiko Operasional**: Denda keterlambatan draf harian sebesar 0.1% - 0.2% bernilai akumulatif besar (maksimal 10%).\n* **Saran Pengendalian**: Lakukan negosiasi ulang agar batas denda tidak melebihi standardisasi 5% total kerja.`;
      } else if (lowerMessage.includes("denda") || lowerMessage.includes("sanksi")) {
        mockReply = `**Detail Verifikasi Sanksi/Denda dalam *${documentName}*:**\n\nMerujuk pada draf dokumen yang diunggah, sanksi keterlambatan diatur dalam Pasal 9. Jika kontraktor melakukan kelalaian penyelesaian pengerjaan harian, pengenaan denda diatur sebesar **0.1% s.d 0.2% per hari** dengan batas plafon maksimal akumulasi denda **5% s.d 10%** dari total seluruh nilai kontrak kerja.`;
      } else {
        mockReply = `Halo! Saya adalah **DocCompare AI**. Saya telah membaca isi berkas **"${documentName}"** Anda.\n\nBerdasarkan pertanyaan Anda (*"${lastUserMessage}"*), saya menyarankan untuk fokus meninjau ketentuan komitmen, pasal sanksi keterlambatan progres, maupun skema likuiditas pembayaran retensi di draf tersebut. Apakah Anda ingin saya menjabarkan bagian khusus dari dokumen ini?`;
      }
    } else {
      mockReply = `Halo! Saya adalah asisten virtual **DocCompare AI** (Mode Simulasi).\n\nAnda sedang melakukan chat tanpa memilih dokumen acuan spesifik. Anda dapat bertanya tentang:\n* Standar draf kontrak proyek konstruksi Kementerian PUPR\n* Cara menyusun standar prosedur kerja (SOP) yang aman\n* Tips negosiasi addendum nilai denda harian kerja.\n\nAjukan pertanyaan Anda untuk memulai simulasi perbincangan!`;
    }

    // Return mock response after a brief simulated network latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    return res.json({
      isMock: true,
      text: mockReply,
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': "aistudio-build",
        },
      },
    });

    // Design System Instructions and Context Incorporation
    let systemInstruction = "Anda adalah asisten audit AI bernama DocCompare AI yang cerdas, profesional, dan objektif khusus menganalisa dokumen legal, kontrak kerja, berita acara, dokumen tender, laporan BOQ/RAB, dan standar operasional prosedur (SOP). Berikan jawaban dalam Bahasa Indonesia yang formal, taktis, berorientasi solusi, dan mudah dibaca (gunakan poin-poin/list tebal jika relevan).\n\n";

    if (documentText) {
      systemInstruction += `Saat ini Anda sedang membantu pengguna menganalisis dokumen spesifik.\nDETAIL ACUAN:\n- Nama Berkas: "${documentName}"\n- Kategori: ${category || "Umum"}\n\nKONTEN TEKS DOKUMEN BERDASARKAN OCR/EKSTRAKSI NYATA:\n====\n${documentText}\n====\n\nINSTRUKSI KERJA:\n1. Jawablah pertanyaan pengguna secara detail berdasarkan teks dokumen acuan yang disediakan di atas.\n2. Jika informasi yang ditanyakan tidak tercantum dalam naskah tersebut, nyatakan hal tersebut secara jujur, lalu berikan saran profesional umum/terbaik yang relevan berdasarkan konteks industri.`;
    } else {
      systemInstruction += "Gunakan pengetahuan luas Anda untuk memberikan saran audit kontrak, draf addendum kerja, strategi mitigasi risiko denda draf proyek, atau penyusunan SOP bisnis yang aman.";
    }

    // Convert message history into SDK format (user | model)
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const replyText = response.text || "Tidak ada respon dihasilkan dari AI.";
    return res.json({
      isMock: false,
      text: replyText,
    });

  } catch (error: any) {
    console.error("Gemini Chat API error:", error);
    return res.status(500).json({ error: "Gagal memproses percakapan AI", details: error.message });
  }
}

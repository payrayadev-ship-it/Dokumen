import { createClient } from "@supabase/supabase-js";

// Retrieve keys from environment variables with hardcoded fallbacks provided by user
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://ggadhtpbequqsaxziezh.supabase.co/";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_CanF_RkuJ8vx0AasOv-YIA_7pLtENqz";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if Supabase is reachable
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from("projects").select("id").limit(1);
    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") {
        // Table doesn't exist yet, but connection is successful!
        return { success: true, message: "Terhubung ke Supabase! (Silakan jalankan SQL schema jika tabel belum dibuat)" };
      }
      return { success: false, message: `Galat Supabase (Kode: ${error.code}): ${error.message}` };
    }
    return { success: true, message: "Terhubung ke Supabase dan tabel projects berhasil diakses!" };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungkan: ${err?.message || err}` };
  }
}

// Ensure the tables sync effortlessly by providing fallbacks
export const supabaseDb = {
  // --- PROJECTS ---
  async getProjects(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase.from("projects").select("*").order("startDate", { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase getProjects fallback used:", err);
      return null;
    }
  },

  async saveProject(project: any): Promise<boolean> {
    try {
      const { error } = await supabase.from("projects").upsert(project);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase saveProject failed:", err);
      return false;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase deleteProject failed:", err);
      return false;
    }
  },

  // --- DOCUMENTS ---
  async getDocuments(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase.from("documents").select("*").order("uploadedAt", { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase getDocuments fallback used:", err);
      return null;
    }
  },

  async saveDocument(document: any): Promise<boolean> {
    try {
      const { error } = await supabase.from("documents").upsert(document);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase saveDocument failed:", err);
      return false;
    }
  },

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase deleteDocument failed:", err);
      return false;
    }
  },

  // --- COMPARISON REPORTS ---
  async getReports(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase.from("comparison_reports").select("*").order("timestamp", { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase getReports fallback used:", err);
      return null;
    }
  },

  async saveReport(report: any): Promise<boolean> {
    try {
      const { error } = await supabase.from("comparison_reports").upsert(report);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase saveReport failed:", err);
      return false;
    }
  },

  async deleteReport(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("comparison_reports").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase deleteReport failed:", err);
      return false;
    }
  },

  // --- ACTIVITY LOGS ---
  async getLogs(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase.from("activity_logs").select("*").order("timestamp", { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase getLogs fallback used:", err);
      return null;
    }
  },

  async saveLog(log: any): Promise<boolean> {
    try {
      const { error } = await supabase.from("activity_logs").upsert(log);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase saveLog failed:", err);
      return false;
    }
  },

  async clearLogs(): Promise<boolean> {
    try {
      const { error } = await supabase.from("activity_logs").delete().neq("id", "");
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase clearLogs failed:", err);
      return false;
    }
  }
};

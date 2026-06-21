export type UserRole = "super_admin" | "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscription: "Free" | "Pro" | "Enterprise";
}

export interface Project {
  id: string;
  name: string;
  code: string;
  owner: string;
  contractor: string;
  consultant: string;
  value: number; // Nilai Kontrak
  startDate: string;
  endDate: string;
  status: "Persiapan" | "Berjalan" | "Selesai" | "Ditunda";
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  docNumber: string;
  version: string;
  date: string;
  category: "Kontrak" | "Addendum" | "BOQ" | "RAB" | "Tender" | "Invoice" | "Surat" | "SOP" | "Lainnya";
  description: string;
  text: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ComparisonReport {
  id: string;
  projectId: string;
  docAId: string;
  docBId: string;
  docAName: string;
  docBName: string;
  category: string;
  timestamp: string;
  isMock: boolean;
  summary: {
    totalChanges: number;
    added: number;
    deleted: number;
    modified: number;
    riskLevel: "Low" | "Medium" | "High" | "Critical";
  };
  changes: Array<{
    type: "added" | "deleted" | "modified";
    category: string;
    oldValue: string;
    newValue: string;
    risk: "Low" | "Medium" | "High" | "Critical";
  }>;
  recommendations: string[];
  executiveSummary: string;
  importantChanges: string;
  contractRisks: string;
  financialRisks: string;
  scheduleRisks: string;
  legalRisks: string;
  operationalRisks: string;
  recommendationActions: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

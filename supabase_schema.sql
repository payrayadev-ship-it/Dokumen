-- DATABASE SCHEMA FOR DOCCOMPARE AI (SUPABASE POSTGRESQL)
-- Copy and run this script in your Supabase SQL Editor to initialize all necessary tables.

-- 1. Enable UUID Extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROJECTS Table
CREATE TABLE IF NOT EXISTS public.projects (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "contractor" TEXT NOT NULL,
    "consultant" TEXT NOT NULL,
    "value" NUMERIC NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- Enable Row Level Security (RLS) or add standard bypass policy for easy testing
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert to projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to projects" ON public.projects FOR DELETE USING (true);


-- 3. Create DOCUMENTS Table
CREATE TABLE IF NOT EXISTS public.documents (
    "id" TEXT PRIMARY KEY,
    "projectId" TEXT REFERENCES public.projects("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "docNumber" TEXT,
    "version" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "text" TEXT NOT NULL,
    "fileSize" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TEXT NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert to documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to documents" ON public.documents FOR DELETE USING (true);


-- 4. Create COMPARISON_REPORTS Table
CREATE TABLE IF NOT EXISTS public.comparison_reports (
    "id" TEXT PRIMARY KEY,
    "projectId" TEXT REFERENCES public.projects("id") ON DELETE CASCADE,
    "docAId" TEXT,
    "docBId" TEXT,
    "docAName" TEXT,
    "docBName" TEXT,
    "category" TEXT,
    "timestamp" TEXT NOT NULL,
    "isMock" BOOLEAN DEFAULT false,
    "summary" JSONB,
    "changes" JSONB,
    "recommendations" JSONB,
    "executiveSummary" TEXT,
    "importantChanges" TEXT,
    "contractRisks" TEXT,
    "financialRisks" TEXT,
    "scheduleRisks" TEXT,
    "legalRisks" TEXT,
    "operationalRisks" TEXT,
    "recommendationActions" TEXT
);

ALTER TABLE public.comparison_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to reports" ON public.comparison_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert to reports" ON public.comparison_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to reports" ON public.comparison_reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to reports" ON public.comparison_reports FOR DELETE USING (true);


-- 5. Create ACTIVITY_LOGS Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    "id" TEXT PRIMARY KEY,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to activity_logs" ON public.activity_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to activity_logs" ON public.activity_logs FOR DELETE USING (true);

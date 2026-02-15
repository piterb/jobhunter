-- migrate:up
-- INITIAL SCHEMA MIGRATION
-- Description: Create core tables for JobHunter in 'jobhunter' schema.

-- 0. SCHEMA SETUP
CREATE SCHEMA IF NOT EXISTS jobhunter;

-- Grant usage (good practice for integration)
GRANT USAGE ON SCHEMA jobhunter TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA jobhunter TO service_role;

-- 1. ENUMS (Schema Scoped)
CREATE TYPE jobhunter.job_status AS ENUM ('Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted');
CREATE TYPE jobhunter.employment_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance');
CREATE TYPE jobhunter.activity_event_type AS ENUM ('Manual', 'Email', 'Call', 'Status_Change', 'Note');
CREATE TYPE jobhunter.activity_category AS ENUM ('Interview', 'Offer', 'Rejection', 'Question', 'Follow-up', 'General');
CREATE TYPE jobhunter.document_type AS ENUM ('Resume', 'Cover_Letter', 'Portfolio', 'Other');
CREATE TYPE jobhunter.ai_feature AS ENUM ('Job_Parsing', 'Email_Analysis', 'Cover_Letter_Generation', 'Smart_Paste');
CREATE TYPE jobhunter.ai_status AS ENUM ('Success', 'Failure', 'Partial_Success');

-- 2. TABLES

-- PROFILES
CREATE TABLE jobhunter.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    professional_headline TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'en',
    openai_api_key TEXT, 
    default_ai_model TEXT DEFAULT 'gpt-4o-mini',
    ghosting_threshold_days INTEGER DEFAULT 14,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOBS
CREATE TABLE jobhunter.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    status jobhunter.job_status DEFAULT 'Saved' NOT NULL,
    employment_type jobhunter.employment_type DEFAULT 'Full-time',
    salary_min INTEGER,
    salary_max INTEGER,
    location TEXT,
    skills_tools TEXT[],
    url TEXT NOT NULL,
    date_posted DATE,
    experience_level TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_linkedin TEXT,
    applied_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITIES
CREATE TABLE jobhunter.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobhunter.jobs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type jobhunter.activity_event_type DEFAULT 'Manual' NOT NULL,
    category jobhunter.activity_category DEFAULT 'General',
    content TEXT NOT NULL,
    raw_content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    checksum TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE jobhunter.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    doc_type jobhunter.document_type DEFAULT 'Resume' NOT NULL,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    content_text TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI USAGE LOGS
CREATE TABLE jobhunter.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature jobhunter.ai_feature NOT NULL,
    model TEXT NOT NULL,
    prompt_summary TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost NUMERIC(10, 6),
    latency_ms INTEGER,
    status jobhunter.ai_status DEFAULT 'Success',
    request_json JSONB,
    response_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX idx_jobs_user_id ON jobhunter.jobs(user_id);
CREATE INDEX idx_jobs_url ON jobhunter.jobs(url);
CREATE INDEX idx_activities_job_id ON jobhunter.activities(job_id);
CREATE INDEX idx_activities_user_id ON jobhunter.activities(user_id);
CREATE INDEX idx_documents_user_id ON jobhunter.documents(user_id);
CREATE INDEX idx_ai_logs_user_id ON jobhunter.ai_usage_logs(user_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA jobhunter TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA jobhunter TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA jobhunter TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA jobhunter TO authenticated;

-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION jobhunter.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON jobhunter.profiles FOR EACH ROW EXECUTE PROCEDURE jobhunter.handle_updated_at();
CREATE TRIGGER on_jobs_updated BEFORE UPDATE ON jobhunter.jobs FOR EACH ROW EXECUTE PROCEDURE jobhunter.handle_updated_at();
CREATE TRIGGER on_documents_updated BEFORE UPDATE ON jobhunter.documents FOR EACH ROW EXECUTE PROCEDURE jobhunter.handle_updated_at();

-- 5. AUTOMATIC PROFILE CREATION
CREATE OR REPLACE FUNCTION jobhunter.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO jobhunter.profiles (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent duplicates on rerun
DROP TRIGGER IF EXISTS jobhunter_on_auth_user_created ON auth.users;
CREATE TRIGGER jobhunter_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE jobhunter.handle_new_user();

-- 6. RLS
ALTER TABLE jobhunter.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (Profiles)
CREATE POLICY "Users can view their own profile" ON jobhunter.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON jobhunter.profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs
CREATE POLICY "Users can view their own jobs" ON jobhunter.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON jobhunter.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON jobhunter.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own jobs" ON jobhunter.jobs FOR DELETE USING (auth.uid() = user_id);

-- Activities
CREATE POLICY "Users can view their own activities" ON jobhunter.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON jobhunter.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON jobhunter.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON jobhunter.activities FOR DELETE USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can view their own documents" ON jobhunter.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON jobhunter.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON jobhunter.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON jobhunter.documents FOR DELETE USING (auth.uid() = user_id);

-- AI Logs
CREATE POLICY "Users can view their own AI logs" ON jobhunter.ai_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI logs" ON jobhunter.ai_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('jobhunter_documents', 'jobhunter_documents', false, 5242880, '{application/pdf,image/*,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown}')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "jobhunter: Users can upload their own documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'jobhunter_documents' AND (split_part(name, '/', 1)) = auth.uid()::text);

CREATE POLICY "jobhunter: Users can view their own documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'jobhunter_documents' AND (split_part(name, '/', 1)) = auth.uid()::text);

CREATE POLICY "jobhunter: Users can update their own documents" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'jobhunter_documents' AND (split_part(name, '/', 1)) = auth.uid()::text);

CREATE POLICY "jobhunter: Users can delete their own documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'jobhunter_documents' AND (split_part(name, '/', 1)) = auth.uid()::text);

-- migrate:down
-- Clean up triggers on auth.users (outside schema)
DROP TRIGGER IF EXISTS jobhunter_on_auth_user_created ON auth.users;

-- Drop Schema (cascades to tables, types, functions inside)
DROP SCHEMA IF EXISTS jobhunter CASCADE;

-- Remove buckets created by this migration
DELETE FROM storage.buckets WHERE id = 'jobhunter_documents';


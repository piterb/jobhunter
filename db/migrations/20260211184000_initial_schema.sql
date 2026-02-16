-- migrate:up
-- INITIAL SCHEMA MIGRATION
-- Description: Create core tables for JobHunter in 'public' schema.

-- 1. ENUMS
CREATE TYPE job_status AS ENUM ('Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted');
CREATE TYPE employment_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance');
CREATE TYPE activity_event_type AS ENUM ('Manual', 'Email', 'Call', 'Status_Change', 'Note');
CREATE TYPE activity_category AS ENUM ('Interview', 'Offer', 'Rejection', 'Question', 'Follow-up', 'General');
CREATE TYPE document_type AS ENUM ('Resume', 'Cover_Letter', 'Portfolio', 'Other');
CREATE TYPE ai_feature AS ENUM ('Job_Parsing', 'Email_Analysis', 'Cover_Letter_Generation', 'Smart_Paste');
CREATE TYPE ai_status AS ENUM ('Success', 'Failure', 'Partial_Success');

-- 2. TABLES

-- PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references the identity from Auth0 (stored as subject)
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    status job_status DEFAULT 'Saved' NOT NULL,
    employment_type employment_type DEFAULT 'Full-time',
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
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    event_type activity_event_type DEFAULT 'Manual' NOT NULL,
    category activity_category DEFAULT 'General',
    content TEXT NOT NULL,
    raw_content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    checksum TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    doc_type document_type DEFAULT 'Resume' NOT NULL,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    content_text TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI USAGE LOGS
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    feature ai_feature NOT NULL,
    model TEXT NOT NULL,
    prompt_summary TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost NUMERIC(10, 6),
    latency_ms INTEGER,
    status ai_status DEFAULT 'Success',
    request_json JSONB,
    response_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_url ON jobs(url);
CREATE INDEX idx_activities_job_id ON activities(job_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);

-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_jobs_updated BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- migrate:down
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS ai_status CASCADE;
DROP TYPE IF EXISTS ai_feature CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS activity_category CASCADE;
DROP TYPE IF EXISTS activity_event_type CASCADE;
DROP TYPE IF EXISTS employment_type CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;

DROP FUNCTION IF EXISTS handle_updated_at CASCADE;


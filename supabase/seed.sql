-- SEED DATA for JobHunter
-- This script populates the local database with test data for development.

-- 1. Create a Test User in Supabase Auth with password
-- Email: dev@example.com
-- Password: dev123456
INSERT INTO auth.users (
    id, 
    instance_id,
    email, 
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data, 
    created_at, 
    updated_at,
    confirmation_token,
    aud,
    role
)
VALUES (
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    '00000000-0000-0000-0000-000000000000',
    'dev@example.com',
    crypt('dev123456', gen_salt('bf')),
    NOW(),
    '{"full_name": "Test Developer", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=dev"}'::jsonb,
    NOW(),
    NOW(),
    '',
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at;

-- Add identity for email/password login
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES (
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ac', -- Fixed UUID related to  user
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    jsonb_build_object(
        'sub', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
        'email', 'dev@example.com'
    ),
    'email',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', -- User ID as provider_id for email provider
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Ensure profile is updated
UPDATE jobhunter.profiles 
SET 
    professional_headline = 'Senior Fullstack Engineer',
    onboarding_completed = true
WHERE id = 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab';

-- 2. Seed Jobs (10 Jobs)
INSERT INTO jobhunter.jobs (id, user_id, title, company, status, employment_type, salary_min, salary_max, location, skills_tools, url, applied_at, last_activity, notes)
VALUES 
(
    'a1b2c3d4-e5f6-4321-8765-100000000001',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'Senior React Developer',
    'Tech Innovators Inc.',
    'Interview',
    'Full-time',
    5000,
    7000,
    'Remote',
    ARRAY['React', 'TypeScript', 'Tailwind', 'Next.js'],
    'https://example.com/jobs/react-dev',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '1 day',
    'Great company culture, mentioned focus on design systems.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000002',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'Python Backend Engineer',
    'DataStream Corp',
    'Applied',
    'Contract',
    4000,
    5500,
    'Bratislava / Hybrid',
    ARRAY['Python', 'Django', 'PostgreSQL', 'Docker'],
    'https://example.com/jobs/python-eng',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days',
    'Need to follow up if I don''t hear back by Friday.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000003',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'UI/UX Designer',
    'Creative Studio',
    'Saved',
    'Full-time',
    3000,
    4500,
    'Remote',
    ARRAY['Figma', 'Adobe XD', 'Prototyping'],
    'https://example.com/jobs/designer',
    NULL,
    NOW() - INTERVAL '3 days',
    'Looks interesting, but salary is a bit low. Need to research perks.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000004',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'Frontend Developer',
    'Old School Systems',
    'Ghosted',
    'Full-time',
    2500,
    3500,
    'Vienna',
    ARRAY['jQuery', 'CSS', 'HTML', 'PHP'],
    'https://example.com/jobs/old-dev',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '25 days',
    'No response after two follow-up emails.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000005',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'Fullstack Engineer',
    'Green Energy Labs',
    'Offer',
    'Full-time',
    6000,
    7500,
    'Berlin / Remote',
    ARRAY['Node.js', 'React', 'AWS', 'Terraform'],
    'https://example.com/jobs/green-energy',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '2 days',
    'Final offer received. Need to review equity terms.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000006',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'DevOps Specialist',
    'CloudScale Systems',
    'Applied',
    'Full-time',
    5500,
    NULL,
    'Remote',
    ARRAY['K8s', 'Docker', 'CI/CD', 'Go'],
    'https://example.com/jobs/devops',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days',
    'Application sent via referral (John Doe).'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000007',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'Mobile Developer (Flutter)',
    'AppVentures',
    'Rejected',
    'Freelance',
    NULL,
    5000,
    'Prague',
    ARRAY['Flutter', 'Dart', 'Firebase'],
    'https://example.com/jobs/flutter',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 days',
    'Rejected after second round. Reason: looking for more senior experience.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000008',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'Solutions Architect',
    'Global Finance Corp',
    'Saved',
    'Full-time',
    8000,
    10000,
    'London / Remote',
    ARRAY['Java', 'Cloud Architecture', 'Spring Boot'],
    'https://example.com/jobs/architect',
    NULL,
    NOW() - INTERVAL '1 day',
    'High compensation. Requires extensive interview process.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000009',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'Data Scientist',
    'AI Research Lab',
    'Applied',
    'Full-time',
    5000,
    6500,
    'Kosice / Remote',
    ARRAY['Python', 'PyTorch', 'SQL', 'NLP'],
    'https://example.com/jobs/data-sci',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    'Exciting project using LLMs.'
),
(
    'a1b2c3d4-e5f6-4321-8765-100000000010',
    'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    'QA Automation Engineer',
    'FinTech Solutions',
    'Applied',
    'Full-time',
    3500,
    4500,
    'Remote',
    ARRAY['Playwright', 'Jest', 'TypeScript'],
    'https://example.com/jobs/qa-eng',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days',
    'Standard application through company website.'
);

-- 3. Seed Activities (Timeline for 5 jobs)

-- Activities for Job 1 (React)
INSERT INTO jobhunter.activities (job_id, user_id, event_type, category, content, occurred_at)
VALUES 
('a1b2c3d4-e5f6-4321-8765-100000000001', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'General', 'Application sent.', NOW() - INTERVAL '15 days'),
('a1b2c3d4-e5f6-4321-8765-100000000001', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'Interview', 'Invitation for first HR call.', NOW() - INTERVAL '12 days'),
('a1b2c3d4-e5f6-4321-8765-100000000001', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Call', 'Interview', 'HR screening call completed.', NOW() - INTERVAL '10 days'),
('a1b2c3d4-e5f6-4321-8765-100000000001', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Note', 'General', 'Task: Prepare for technical interview on Friday.', NOW() - INTERVAL '4 days'),
('a1b2c3d4-e5f6-4321-8765-100000000001', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Status_Change', 'General', 'Status changed to Interview.', NOW() - INTERVAL '1 day');

-- Activities for Job 4 (Old School - Ghosting example)
INSERT INTO jobhunter.activities (job_id, user_id, event_type, category, content, occurred_at)
VALUES 
('a1b2c3d4-e5f6-4321-8765-100000000004', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'General', 'Initial application.', NOW() - INTERVAL '40 days'),
('a1b2c3d4-e5f6-4321-8765-100000000004', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'Follow-up', 'Sent follow-up email #1.', NOW() - INTERVAL '30 days'),
('a1b2c3d4-e5f6-4321-8765-100000000004', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'Follow-up', 'Sent follow-up email #2 - final attempt.', NOW() - INTERVAL '25 days');

-- Activities for Job 5 (Offer)
INSERT INTO jobhunter.activities (job_id, user_id, event_type, category, content, occurred_at)
VALUES 
('a1b2c3d4-e5f6-4321-8765-100000000005', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'Interview', 'Final round interview scheduled.', NOW() - INTERVAL '10 days'),
('a1b2c3d4-e5f6-4321-8765-100000000005', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Call', 'Offer', 'Call from hiring manager - Verbal offer given!', NOW() - INTERVAL '3 days'),
('a1b2c3d4-e5f6-4321-8765-100000000005', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'Offer', 'Formal offer letter received via email.', NOW() - INTERVAL '2 days');

-- Activities for Job 7 (Rejected)
INSERT INTO jobhunter.activities (job_id, user_id, event_type, category, content, occurred_at)
VALUES 
('a1b2c3d4-e5f6-4321-8765-100000000007', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'Interview', 'Tech interview scheduled.', NOW() - INTERVAL '15 days'),
('a1b2c3d4-e5f6-4321-8765-100000000007', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Note', 'General', 'Tech interview was tough, focus on Flutter internals.', NOW() - INTERVAL '14 days'),
('a1b2c3d4-e5f6-4321-8765-100000000007', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'Rejection', 'Rejection email received. Feedback: lack of experience with large state management.', NOW() - INTERVAL '10 days');

-- Activities for Job 2 (Applied)
INSERT INTO jobhunter.activities (job_id, user_id, event_type, category, content, occurred_at)
VALUES 
('a1b2c3d4-e5f6-4321-8765-100000000002', 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Email', 'General', 'Applied via company portal.', NOW() - INTERVAL '8 days');

-- 4. Seed AI Logs (10 Logs)
INSERT INTO jobhunter.ai_usage_logs (user_id, feature, model, prompt_summary, tokens_input, tokens_output, cost, latency_ms, status)
VALUES 
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Job_Parsing', 'gpt-4o-mini', 'Parsing LinkedIn React Dev job', 1200, 350, 0.00025, 1450, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Job_Parsing', 'gpt-4o-mini', 'Parsing DataStream Python job', 1100, 320, 0.00022, 1100, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Smart_Paste', 'gpt-4o-mini', 'Analyzing interview invitation email', 500, 180, 0.00010, 950, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Smart_Paste', 'gpt-4o-mini', 'Analyzing rejection email feedback', 600, 200, 0.00012, 1050, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Cover_Letter_Generation', 'gpt-4o', 'Generating letter for Green Energy Labs', 3500, 800, 0.04300, 4200, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Job_Parsing', 'gpt-4o-mini', 'Parsing DevOps role', 1400, 400, 0.00030, 1600, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Job_Parsing', 'gpt-4o-mini', 'Parsing CloudScale K8s inzerát', 950, 280, 0.00018, 1200, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Smart_Paste', 'gpt-4o-mini', 'Parsing follow-up note', 300, 80, 0.00005, 600, 'Success'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Cover_Letter_Generation', 'gpt-4o', 'Attempting CV analysis', 5000, 0, 0.01500, 2500, 'Failure'),
('d7b6f3b0-1234-4a5b-8c9d-1234567890ab', 'Job_Parsing', 'gpt-4o-mini', 'Parsing QA Automation role', 1150, 310, 0.00021, 1300, 'Success');



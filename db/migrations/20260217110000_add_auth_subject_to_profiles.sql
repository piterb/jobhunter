-- migrate:up
-- Add external IdP subject mapping to keep internal UUID stable across providers.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS auth_subject TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_auth_subject_unique
ON profiles (auth_subject)
WHERE auth_subject IS NOT NULL;

-- migrate:down
DROP INDEX IF EXISTS idx_profiles_auth_subject_unique;

ALTER TABLE profiles
DROP COLUMN IF EXISTS auth_subject;

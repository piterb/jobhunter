# Example environment configuration
# Copy this file to '<environment>.tfvars' (e.g. tst.tfvars) and fill in the values.
# IMPORTANT: Never commit files containing real secrets (token, password) to git.

# --- General Configuration ---
project_id           = "your-gcp-project-id"
env_name             = "tst"             # tst, prod, etc.
github_branch        = "tst"             # Branch that triggers deploy
region               = "europe-west1"    # Optional, defaults to europe-west1
app_name             = "jobhunter"       # Optional, defaults to jobhunter

# --- Supabase Configuration ---
supabase_project_ref  = "abcdefghijklmno" # From Supabase Dashboard

# --- Sensitive Data ---
# It is recommended to keep these in a local .tfvars file that is git-ignored, 
# or passed via environment variables (TF_VAR_...)
supabase_access_token = "sbp_your_access_token_here"
db_password           = "your_database_password_here"

# --- Optional Extras ---
# feedback_github_token = "ghp_..."
# feedback_enabled      = "true"

# --- Google OAuth (Social Login) ---
# google_client_id     = "your-google-client-id.apps.googleusercontent.com"
# google_client_secret = "your-google-client-secret"

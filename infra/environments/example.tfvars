# Example environment configuration
# Copy this file to '<environment>.tfvars' (e.g. tst.tfvars) and fill in the values.
# IMPORTANT: Never commit files containing real secrets (token, password) to git.

# --- General Configuration ---
project_id    = "your-gcp-project-id"
env_name      = "tst"          # tst, prod, etc.
github_branch = "tst"          # Branch that triggers deploy
region        = "europe-west1" # Optional, defaults to europe-west1
app_name      = "jobhunter"    # Optional, defaults to jobhunter

# --- Sensitive Data (Neon/Auth0/Google OAuth) ---
# It is recommended to keep these in a local .tfvars file that is git-ignored, 
# or passed via environment variables (TF_VAR_...)
database_url          = "postgresql://USER:PASSWORD@EP-xxxx.neon.tech/neondb?sslmode=require"
auth0_issuer_base_url = "https://your-tenant.eu.auth0.com"
auth0_audience        = "jobhunter-api"
google_client_id      = "your-google-client-id.apps.googleusercontent.com"
google_client_secret  = "your-google-client-secret"

# --- Optional Extras ---
# feedback_github_token = "ghp_..."
# feedback_enabled      = "true"
# gcs_location           = "EU"
# resource_prefix_override = "jobhunter-tst"

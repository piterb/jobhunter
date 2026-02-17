# Example environment configuration
# Copy this file to '<environment>.tfvars' (e.g. tst.tfvars) and fill in the values.
# IMPORTANT: Never commit files containing real secrets (token, password) to git.

# --- General Configuration ---
project_id    = "your-gcp-project-id"
env_name      = "tst"          # tst, prod, etc.
github_branch = "tst"          # Branch that triggers deploy
region        = "europe-west1" # Optional, defaults to europe-west1
app_name      = "jobhunter"    # Optional, defaults to jobhunter

# --- Sensitive Data (Neon/Auth0 provider credentials) ---
# It is recommended to keep these in a local .tfvars file that is git-ignored, 
# or passed via environment variables (TF_VAR_...)
neon_api_key                  = "napi_xxx"             # project-scoped key is supported and recommended
neon_project_id               = "empty-brook-12345678" # project is created manually in Neon
auth0_domain                  = "your-tenant.eu.auth0.com"
auth0_terraform_client_id     = "your-auth0-m2m-client-id"
auth0_terraform_client_secret = "your-auth0-m2m-client-secret"

# --- Usually keep defaults (Terraform/app derives these automatically) ---
# You do NOT need to set these unless you intentionally override behavior.
# neon_database_name = "jobhunter"
# neon_role_name = "jobhunter"
# neon_branch_name = "" # default = <app_name>-<env_name>
#
# auth_provider = "auth0"
# auth_local_dev_use_mock_identity = false
# oidc_issuer = "" # default derived from auth0_domain
# oidc_audience = "" # default derived from created Auth0 API identifier
# oidc_client_allowlist = "" # default = created Auth0 SPA client_id
# oidc_allowed_algorithms = "RS256"
# auth_enforce_app_claims = false
# auth_app_id_claim = "app_id"
# auth_app_env_claim = "app_env"
# auth_require_client_allowlist = true
# auth_required_scopes = ""
# next_public_auth0_scope = "openid profile email"

# Optional: create/update Auth0 Google social connection and wire it to generated SPA app.
# auth0_google_connection_enabled = true
# google_client_id = "your-google-client-id.apps.googleusercontent.com"
# google_client_secret = "your-google-client-secret"

# --- Optional Extras ---
# feedback_github_token = "ghp_..."
# feedback_enabled      = "true"
# gcs_location           = "EU"
# resource_prefix_override = "jobhunter-tst"

# Example environment configuration
# Copy this file to '<environment>.tfvars' (e.g. tst2.tfvars) and fill in values.
# IMPORTANT: Never commit files containing real secrets.

# =============================================================================
# Stack identity (used in naming/isolation)
# =============================================================================
# Keep this pair unique inside one GCP project.
app_name = "jobhunter" # e.g. app1, app2
env_name = "tst2"      # e.g. tst1, tst2, prod

# =============================================================================
# Google Cloud (GCP)
# =============================================================================
gcp_project_id = "your-gcp-project-id" # GCP Console -> Project ID
region         = "europe-west1"        # GCP region for Cloud Run/Artifact Registry
gcs_location   = "EU"                  # GCS location for buckets

# Optional override. Default is "<app_name>-<env_name>".
# resource_prefix_override = "jobhunter-tst2"

# =============================================================================
# GitHub
# =============================================================================
# From repo URL: https://github.com/<github_owner>/<github_repo>
github_owner  = "your-github-owner-or-org"
github_repo   = "jobhunter"
github_branch = "tst2" # branch that triggers generated deploy workflow

# =============================================================================
# Neon
# =============================================================================
neon_project_id = "empty-brook-12345678" # Neon Console -> Project Settings -> Project ID
neon_api_key    = "napi_xxx"             # project-scoped key recommended

# Optional overrides (usually keep defaults)
# Isolation model: same Neon branch, dedicated DB + role per app/env.
# Defaults:
#   neon_database_name = <app_name>_<env_name>
#   neon_role_name = <app_name>_<env_name>_app
# neon_database_name = ""
# neon_role_name = ""
#
# Neon branch hosting app DB resources:
# - leave commented/empty => use existing "main" branch
# - set value (e.g. "dev") => Terraform uses that branch and creates it if missing
# neon_db_branch_name = "main"

# =============================================================================
# Auth0 (provider access + tenant)
# =============================================================================
auth0_domain                  = "your-tenant.eu.auth0.com"     # Auth0 Dashboard -> Settings -> Domain
auth0_terraform_client_id     = "your-auth0-m2m-client-id"     # Auth0 M2M app -> Client ID
auth0_terraform_client_secret = "your-auth0-m2m-client-secret" # Auth0 M2M app -> Client Secret

# Optional Auth0 naming overrides
# auth0_spa_name_override = ""
# auth0_api_name_override = ""

# Optional: enable Auth0 Google social connection from Terraform
# Set both values only if you already created Google OAuth Client credentials.
# auth0_google_connection_enabled = true
# google_client_id = "your-google-client-id.apps.googleusercontent.com"
# google_client_secret = "your-google-client-secret"

# =============================================================================
# Runtime auth policy (advanced - usually keep defaults)
# =============================================================================
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

# =============================================================================
# Other optional app settings
# =============================================================================
# feedback_enabled = "true"
# feedback_github_token = "ghp_..."

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
# - leave commented/empty => use existing Neon default (primary) branch
# - set value (e.g. "dev") => Terraform uses that branch and creates it if missing
# neon_db_branch_name = "main"

# =============================================================================
# Identity Terraform state inputs
# =============================================================================
# Paths are resolved from infra/ working directory.
# base state must export: keycloak_url, realm_name
# app state must export: spa_client_id, api_client_id
identity_base_state_path = "../identity/terraform/base/terraform.tst.tfstate"
identity_app_state_path  = "../identity/terraform/apps/jobhunter-tst-webapp-spa/terraform.tst.tfstate"

# =============================================================================
# Runtime auth policy (advanced - usually keep defaults)
# =============================================================================
# auth_provider = "keycloak"
# auth_local_dev_use_mock_identity = false
# oidc_issuer = "" # default derived from identity base state
# oidc_audience = "" # default derived from app identity state api_client_id
# oidc_client_allowlist = "" # default = app identity state spa_client_id
# oidc_allowed_algorithms = "RS256"
# auth_enforce_app_claims = false
# auth_app_id_claim = "app_id"
# auth_app_env_claim = "app_env"
# auth_require_client_allowlist = true
# auth_required_scopes = ""
# next_public_auth_scope = "openid profile email"

# =============================================================================
# Other optional app settings
# =============================================================================
# feedback_enabled = "true"
# feedback_github_token = "ghp_..."

# -----------------------------------------------------------------------------
# Core app/env identity
# -----------------------------------------------------------------------------

variable "app_name" {
  description = "Application identifier used in naming (e.g. app1, jobhunter)"
  type        = string
  default     = "jobhunter"
}

variable "env_name" {
  description = "Environment identifier (e.g. tst1, tst2, prod)"
  type        = string
}

# -----------------------------------------------------------------------------
# Google Cloud (GCP)
# -----------------------------------------------------------------------------

variable "gcp_project_id" {
  description = "Target GCP project ID where resources will be created"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run and Artifact Registry (e.g. europe-west1)"
  type        = string
  default     = "europe-west1"
}

variable "gcs_location" {
  description = "GCS bucket location (e.g. EU)"
  type        = string
  default     = "EU"
}

variable "resource_prefix_override" {
  description = "Optional bucket/runtime prefix override. Default: <app_name>-<env_name>"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# GitHub
# -----------------------------------------------------------------------------

variable "github_owner" {
  description = "GitHub owner/org name (e.g. piterb)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name without owner (e.g. jobhunter)"
  type        = string
}

variable "github_branch" {
  description = "Git branch that triggers deployment workflow for this stack"
  type        = string
}

# -----------------------------------------------------------------------------
# Neon
# -----------------------------------------------------------------------------

variable "neon_api_key" {
  description = "Neon API key (project-scoped supported) used by Terraform provider"
  type        = string
  sensitive   = true
}

variable "neon_project_id" {
  description = "Existing Neon project ID created manually"
  type        = string
}

variable "neon_database_name" {
  description = "Database name to create in Neon. Empty => auto-derived from <app_name>-<env_name>"
  type        = string
  default     = ""
}

variable "neon_role_name" {
  description = "Role/user name to create in Neon. Empty => auto-derived from <app_name>-<env_name>"
  type        = string
  default     = ""
}

variable "neon_db_branch_name" {
  description = "Neon branch name. Empty => use existing Neon default (primary) branch. Non-empty => use that branch and auto-create it if missing."
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Identity + OIDC runtime policy
# -----------------------------------------------------------------------------

variable "identity_base_state_path" {
  description = "Path to the Terraform state file for the shared identity base stack"
  type        = string
}

variable "identity_app_state_path" {
  description = "Path to the Terraform state file for the application identity stack"
  type        = string
}

variable "auth_provider" {
  description = "Runtime auth provider (matches AUTH_PROVIDER)"
  type        = string
  default     = "keycloak"
}

variable "auth_local_dev_use_mock_identity" {
  description = "Runtime mock identity toggle (matches AUTH_LOCAL_DEV_USE_MOCK_IDENTITY)"
  type        = bool
  default     = false
}

variable "oidc_issuer" {
  description = "OIDC issuer override. Empty => derived from identity base stack"
  type        = string
  default     = ""
}

variable "oidc_audience" {
  description = "OIDC audience override. Empty => derived from identity app stack API client id"
  type        = string
  default     = ""
}

variable "oidc_client_allowlist" {
  description = "OIDC client allowlist override. Empty => derived from identity app stack SPA client id"
  type        = string
  default     = ""
}

variable "oidc_allowed_algorithms" {
  description = "Comma-separated allowed JWT algorithms (matches OIDC_ALLOWED_ALGORITHMS)"
  type        = string
  default     = "RS256"
}

variable "auth_enforce_app_claims" {
  description = "Enforce app claims in JWT (matches AUTH_ENFORCE_APP_CLAIMS)"
  type        = bool
  default     = false
}

variable "auth_app_id_claim" {
  description = "JWT claim name for app id (matches AUTH_APP_ID_CLAIM)"
  type        = string
  default     = "app_id"
}

variable "auth_app_env_claim" {
  description = "JWT claim name for app env (matches AUTH_APP_ENV_CLAIM)"
  type        = string
  default     = "app_env"
}

variable "auth_require_client_allowlist" {
  description = "Require non-empty OIDC client allowlist (matches AUTH_REQUIRE_CLIENT_ALLOWLIST)"
  type        = bool
  default     = true
}

variable "auth_required_scopes" {
  description = "Comma-separated required scopes (matches AUTH_REQUIRED_SCOPES)"
  type        = string
  default     = ""
}

variable "next_public_auth_scope" {
  description = "Frontend auth scope (matches NEXT_PUBLIC_KEYCLOAK_SCOPE)"
  type        = string
  default     = "openid profile email"
}

# -----------------------------------------------------------------------------
# Misc application settings
# -----------------------------------------------------------------------------

variable "feedback_enabled" {
  description = "Whether feedback module is enabled"
  type        = string
  default     = "true"
}

variable "feedback_github_token" {
  description = "GitHub token for feedback module integration"
  type        = string
  sensitive   = true
  default     = ""
}

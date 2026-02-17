variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "env_name" {
  description = "Environment name (tst/prod)"
  type        = string
}

variable "github_branch" {
  description = "The git branch that triggers deployment for this environment"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "europe-west1"
}

variable "app_name" {
  description = "Meno aplikácie"
  type        = string
  default     = "jobhunter"
}

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
  description = "Neon database name"
  type        = string
  default     = "jobhunter"
}

variable "neon_role_name" {
  description = "Neon role (user) name"
  type        = string
  default     = "jobhunter"
}

variable "neon_branch_name" {
  description = "Neon branch name to create inside existing project. If empty, defaults to <app_name>-<env_name>."
  type        = string
  default     = ""
}

variable "feedback_github_token" {
  description = "GitHub Token for feedback module"
  type        = string
  sensitive   = true
  default     = ""
}

variable "feedback_enabled" {
  description = "Whether feedback module is enabled"
  type        = string
  default     = "true"
}

variable "auth_provider" {
  description = "Auth provider used by server runtime (matches AUTH_PROVIDER)"
  type        = string
  default     = "auth0"
}

variable "auth_local_dev_use_mock_identity" {
  description = "Server mock auth bypass flag (matches AUTH_LOCAL_DEV_USE_MOCK_IDENTITY)"
  type        = bool
  default     = false
}

variable "auth_enforce_app_claims" {
  description = "Whether server should enforce app claims in JWT (matches AUTH_ENFORCE_APP_CLAIMS)"
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
  description = "Require configured OIDC client allowlist (matches AUTH_REQUIRE_CLIENT_ALLOWLIST)"
  type        = bool
  default     = true
}

variable "auth_required_scopes" {
  description = "Comma-separated required scopes (matches AUTH_REQUIRED_SCOPES)"
  type        = string
  default     = ""
}

variable "oidc_allowed_algorithms" {
  description = "Comma-separated allowed JWT algorithms (matches OIDC_ALLOWED_ALGORITHMS)"
  type        = string
  default     = "RS256"
}

variable "oidc_issuer" {
  description = "OIDC issuer URL override (matches OIDC_ISSUER). If empty, computed from Auth0 domain."
  type        = string
  default     = ""
}

variable "oidc_audience" {
  description = "OIDC audience override (matches OIDC_AUDIENCE). If empty, uses created Auth0 API identifier."
  type        = string
  default     = ""
}

variable "oidc_client_allowlist" {
  description = "Comma-separated OIDC client ID allowlist (matches OIDC_CLIENT_ALLOWLIST). If empty, uses created frontend client ID."
  type        = string
  default     = ""
}

variable "auth0_domain" {
  description = "Auth0 tenant domain (with or without https://)"
  type        = string
}

variable "auth0_terraform_client_id" {
  description = "Auth0 M2M client ID used by Terraform provider"
  type        = string
  sensitive   = true
}

variable "auth0_terraform_client_secret" {
  description = "Auth0 M2M client secret used by Terraform provider"
  type        = string
  sensitive   = true
}

variable "auth0_spa_name_override" {
  description = "Optional Auth0 SPA app name override"
  type        = string
  default     = ""
}

variable "auth0_api_name_override" {
  description = "Optional Auth0 API name override"
  type        = string
  default     = ""
}

variable "next_public_auth0_scope" {
  description = "Client-side Auth0 scope (matches NEXT_PUBLIC_AUTH0_SCOPE)"
  type        = string
  default     = "openid profile email"
}

variable "google_client_id" {
  description = "Google OAuth Client ID for Auth0 Google connection"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret for Auth0 Google connection"
  type        = string
  sensitive   = true
  default     = ""
}

variable "auth0_google_connection_enabled" {
  description = "Create/update Google social connection in Auth0"
  type        = bool
  default     = true
}

variable "gcs_location" {
  description = "Bucket location for GCS storage"
  type        = string
  default     = "EU"
}

variable "resource_prefix_override" {
  description = "Optional override for resource prefix (bucket names, runtime prefix)"
  type        = string
  default     = ""
}

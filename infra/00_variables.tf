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

variable "database_url" {
  description = "Neon PostgreSQL connection URL"
  type        = string
  sensitive   = true
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

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "auth0_issuer_base_url" {
  description = "Auth0 issuer base URL (e.g. https://tenant.eu.auth0.com)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "auth0_audience" {
  description = "Auth0 API audience"
  type        = string
  default     = "jobhunter-api"
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

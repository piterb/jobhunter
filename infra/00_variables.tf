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

variable "supabase_project_ref" {
  description = "Supabase Project Reference ID"
  type        = string
}

variable "supabase_access_token" {
  description = "Supabase Access Token"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Heslo k Supabase databáze"
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

variable "auth_additional_redirect_urls" {
  description = "Shared redirect URLs for multiple environments"
  type        = list(string)
  default     = []
}

variable "extra_exposed_schemas" {
  description = "Additional schemas to expose in PostgREST API (comma separated)"
  type        = string
  default     = ""
}

variable "supabase_site_url" {
  description = "The main Site URL for the Supabase project (Auth settings)"
  type        = string
  default     = ""
}

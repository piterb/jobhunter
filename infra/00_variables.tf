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

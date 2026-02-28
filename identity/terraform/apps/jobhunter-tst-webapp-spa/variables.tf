variable "base_state_path" {
  description = "Path to the base Terraform state file"
  type        = string
  default     = "../../base/terraform.tfstate"
}

variable "jobhunter_tst_webapp_spa_spa_redirect_uris" {
  description = "Allowed redirect URIs for SPA 'jobhunter-tst-webapp-spa'"
  type        = list(string)
}

variable "jobhunter_tst_webapp_spa_spa_web_origins" {
  description = "Allowed web origins for SPA 'jobhunter-tst-webapp-spa'"
  type        = list(string)
}

variable "jobhunter_tst_webapp_spa_spa_post_logout_redirect_uris" {
  description = "Allowed post-logout redirect URIs for SPA 'jobhunter-tst-webapp-spa'"
  type        = list(string)
}

variable "jobhunter_tst_webapp_spa_api_audience" {
  description = "Audience value for API 'jobhunter-tst-webapp-spa'"
  type        = string
  default     = "jobhunter-tst-webapp-spa-api"
}

variable "jobhunter_tst_webapp_spa_enable_direct_access_grants" {
  description = "Enable direct grants for SPA 'jobhunter-tst-webapp-spa' only when explicitly required"
  type        = bool
  default     = false
}

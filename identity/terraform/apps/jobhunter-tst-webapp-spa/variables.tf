variable "keycloak_url" {
  description = "Keycloak base URL"
  type        = string
}

variable "keycloak_client_id" {
  description = "Client ID with permissions to manage app resources"
  type        = string
}

variable "keycloak_client_secret" {
  description = "Client secret for keycloak_client_id"
  type        = string
  sensitive   = true
}

variable "realm_name" {
  description = "Existing realm managed by the platform team"
  type        = string
  default     = "jobhunter-tst"
}

variable "environment" {
  description = "Environment label used for conventions (tst/stg/prd)"
  type        = string
  default     = "tst"
}

variable "jobhunter_tst_webapp_spa_spa_redirect_uris" {
  description = "Allowed redirect URIs for SPA 'jobhunter-tst-webapp-spa'"
  type        = list(string)

  validation {
    condition = var.environment != "prd" || alltrue([
      for uri in var.jobhunter_tst_webapp_spa_spa_redirect_uris : !strcontains(uri, "*")
    ])
    error_message = "Wildcards in jobhunter_tst_webapp_spa_spa_redirect_uris are not allowed in prd."
  }
}

variable "jobhunter_tst_webapp_spa_spa_web_origins" {
  description = "Allowed web origins for SPA 'jobhunter-tst-webapp-spa'"
  type        = list(string)

  validation {
    condition = var.environment != "prd" || alltrue([
      for origin in var.jobhunter_tst_webapp_spa_spa_web_origins : !strcontains(origin, "*")
    ])
    error_message = "Wildcards in jobhunter_tst_webapp_spa_spa_web_origins are not allowed in prd."
  }
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

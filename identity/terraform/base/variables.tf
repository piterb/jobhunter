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

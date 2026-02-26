provider "keycloak" {
  url           = var.keycloak_url
  client_id     = var.keycloak_client_id
  client_secret = var.keycloak_client_secret
  realm         = var.realm_name
}

data "keycloak_realm" "target" {
  realm = var.realm_name
}

# Base stack bootstrap only:
# - shared provider/auth wiring
# - existing realm reference
# - no app-specific clients/roles here

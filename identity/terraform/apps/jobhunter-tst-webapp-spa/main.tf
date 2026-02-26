provider "keycloak" {
  url           = var.keycloak_url
  client_id     = var.keycloak_client_id
  client_secret = var.keycloak_client_secret
  realm         = var.realm_name
}

data "keycloak_realm" "target" {
  realm = var.realm_name
}

resource "keycloak_openid_client" "jobhunter_tst_webapp_spa_spa" {
  realm_id  = data.keycloak_realm.target.id
  client_id = "jobhunter-tst-webapp-spa-spa-${var.environment}"
  name      = "jobhunter-tst-webapp-spa SPA"

  access_type                  = "PUBLIC"
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = var.jobhunter_tst_webapp_spa_enable_direct_access_grants

  pkce_code_challenge_method = "S256"
  valid_redirect_uris        = var.jobhunter_tst_webapp_spa_spa_redirect_uris
  web_origins                = var.jobhunter_tst_webapp_spa_spa_web_origins
}

resource "keycloak_openid_client" "jobhunter_tst_webapp_spa_api" {
  realm_id  = data.keycloak_realm.target.id
  client_id = "jobhunter-tst-webapp-spa-api-${var.environment}"
  name      = "jobhunter-tst-webapp-spa API"

  access_type                  = "CONFIDENTIAL"
  standard_flow_enabled        = false
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = true
}

resource "keycloak_role" "jobhunter_tst_webapp_spa_app_user" {
  realm_id    = data.keycloak_realm.target.id
  name        = "jobhunter-tst-webapp-spa_app_user"
  description = "Base role for jobhunter-tst-webapp-spa application users"
}

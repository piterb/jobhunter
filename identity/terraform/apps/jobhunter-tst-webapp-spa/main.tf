provider "keycloak" {
  url           = data.terraform_remote_state.base.outputs.keycloak_url
  client_id     = data.terraform_remote_state.base.outputs.keycloak_client_id
  client_secret = data.terraform_remote_state.base.outputs.keycloak_client_secret
  realm         = data.terraform_remote_state.base.outputs.realm_name
}

data "terraform_remote_state" "base" {
  backend = "local"

  config = {
    path = var.base_state_path
  }
}

locals {
  realm_name  = data.terraform_remote_state.base.outputs.realm_name
  environment = data.terraform_remote_state.base.outputs.environment
}

data "keycloak_realm" "target" {
  realm = local.realm_name
}

resource "keycloak_openid_client" "jobhunter_tst_webapp_spa_spa" {
  realm_id  = data.keycloak_realm.target.id
  client_id = "jobhunter-tst-webapp-spa-spa-${local.environment}"
  name      = "jobhunter-tst-webapp-spa SPA"

  access_type                  = "PUBLIC"
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = var.jobhunter_tst_webapp_spa_enable_direct_access_grants

  pkce_code_challenge_method = "S256"
  valid_redirect_uris        = var.jobhunter_tst_webapp_spa_spa_redirect_uris
  valid_post_logout_redirect_uris = var.jobhunter_tst_webapp_spa_spa_post_logout_redirect_uris
  web_origins                = var.jobhunter_tst_webapp_spa_spa_web_origins

  lifecycle {
    precondition {
      condition = local.environment != "prd" || alltrue([
        for uri in var.jobhunter_tst_webapp_spa_spa_redirect_uris : !strcontains(uri, "*")
      ])
      error_message = "Wildcards in jobhunter_tst_webapp_spa_spa_redirect_uris are not allowed in prd."
    }

    precondition {
      condition = local.environment != "prd" || alltrue([
        for origin in var.jobhunter_tst_webapp_spa_spa_web_origins : !strcontains(origin, "*")
      ])
      error_message = "Wildcards in jobhunter_tst_webapp_spa_spa_web_origins are not allowed in prd."
    }

    precondition {
      condition = local.environment != "prd" || alltrue([
        for uri in var.jobhunter_tst_webapp_spa_spa_post_logout_redirect_uris : !strcontains(uri, "*")
      ])
      error_message = "Wildcards in jobhunter_tst_webapp_spa_spa_post_logout_redirect_uris are not allowed in prd."
    }
  }
}

resource "keycloak_openid_client" "jobhunter_tst_webapp_spa_api" {
  realm_id  = data.keycloak_realm.target.id
  client_id = "jobhunter-tst-webapp-spa-api-${local.environment}"
  name      = "jobhunter-tst-webapp-spa API"

  access_type                  = "CONFIDENTIAL"
  standard_flow_enabled        = false
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = true
}

resource "keycloak_openid_audience_protocol_mapper" "jobhunter_tst_webapp_spa_spa_api_audience" {
  realm_id  = data.keycloak_realm.target.id
  client_id = keycloak_openid_client.jobhunter_tst_webapp_spa_spa.id
  name      = "jobhunter-tst-webapp-spa API audience"

  included_client_audience = keycloak_openid_client.jobhunter_tst_webapp_spa_api.client_id
  add_to_access_token      = true
  add_to_id_token          = false
}

resource "keycloak_role" "jobhunter_tst_webapp_spa_app_user" {
  realm_id    = data.keycloak_realm.target.id
  name        = "jobhunter-tst-webapp-spa_app_user"
  description = "Base role for jobhunter-tst-webapp-spa application users"
}

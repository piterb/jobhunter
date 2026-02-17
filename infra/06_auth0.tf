resource "auth0_resource_server" "api" {
  name       = local.auth0_api_name
  identifier = local.auth0_api_identifier

  signing_alg = "RS256"
}

resource "auth0_client" "frontend" {
  name            = local.auth0_spa_name
  description     = "Frontend SPA for ${var.app_name} (${var.env_name})"
  app_type        = "spa"
  oidc_conformant = true
  is_first_party  = true

  callbacks = [
    local.client_redirect_uri
  ]

  allowed_logout_urls = [
    local.client_logout_uri
  ]

  web_origins = [
    google_cloud_run_v2_service.client.uri
  ]

  allowed_origins = [
    google_cloud_run_v2_service.client.uri
  ]

  jwt_configuration {
    alg = "RS256"
  }

  refresh_token {
    rotation_type                = "rotating"
    expiration_type              = "expiring"
    infinite_idle_token_lifetime = false
    infinite_token_lifetime      = false
    token_lifetime               = 2592000
    idle_token_lifetime          = 2592000
  }
}

resource "auth0_connection" "google" {
  count = var.auth0_google_connection_enabled && var.google_client_id != "" && var.google_client_secret != "" ? 1 : 0

  name                 = "google-oauth2"
  strategy             = "google-oauth2"
  is_domain_connection = false

  options {
    client_id     = var.google_client_id
    client_secret = var.google_client_secret
    scopes = [
      "openid",
      "profile",
      "email"
    ]
  }
}

resource "auth0_connection_client" "google_frontend" {
  count = var.auth0_google_connection_enabled && var.google_client_id != "" && var.google_client_secret != "" ? 1 : 0

  connection_id = auth0_connection.google[0].id
  client_id     = auth0_client.frontend.client_id
}

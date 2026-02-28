locals {
  github_owner = var.github_owner
  github_repo  = var.github_repo

  app_env_name = "${var.app_name}-${var.env_name}"
  app_env_slug = replace(lower(local.app_env_name), "/[^a-z0-9-]/", "-")
  id_suffix    = substr(sha1(local.app_env_slug), 0, 6)

  # GCP service account id is limited to 30 chars.
  service_account_id    = "dpl-${substr(local.app_env_slug, 0, 19)}-${local.id_suffix}"
  service_account_email = "${local.service_account_id}@${var.gcp_project_id}.iam.gserviceaccount.com"

  # Workload Identity identifiers have tighter length constraints than display names.
  wif_pool_id     = "ghp-${substr(local.app_env_slug, 0, 20)}-${local.id_suffix}"
  wif_provider_id = "ghpr-${substr(local.app_env_slug, 0, 19)}-${local.id_suffix}"

  artifact_repo_name = "repo-${local.app_env_slug}"

  server_service_name = "${local.app_env_slug}-server"
  client_service_name = "${local.app_env_slug}-client"

  resource_prefix   = var.resource_prefix_override != "" ? var.resource_prefix_override : "${var.app_name}-${var.env_name}"
  keycloak_url_raw  = trimsuffix(data.terraform_remote_state.identity_base.outputs.keycloak_url, "/")
  keycloak_base_url = startswith(local.keycloak_url_raw, "http://") || startswith(local.keycloak_url_raw, "https://") ? local.keycloak_url_raw : "https://${local.keycloak_url_raw}"
  keycloak_realm    = data.terraform_remote_state.identity_base.outputs.realm_name
  oidc_issuer_url   = var.oidc_issuer != "" ? var.oidc_issuer : "${local.keycloak_base_url}/realms/${local.keycloak_realm}"

  oidc_audience_value     = var.oidc_audience != "" ? var.oidc_audience : data.terraform_remote_state.identity_app.outputs.api_client_id
  client_redirect_uri     = "${google_cloud_run_v2_service.client.uri}/auth/callback"
  client_logout_uri       = "${google_cloud_run_v2_service.client.uri}/login"
  auth_frontend_client_id = data.terraform_remote_state.identity_app.outputs.spa_client_id
  default_client_allow    = local.auth_frontend_client_id
  oidc_client_allowlist   = var.oidc_client_allowlist != "" ? var.oidc_client_allowlist : local.default_client_allow
  neon_db_base_name       = replace(local.app_env_slug, "-", "_")
  neon_role_name          = var.neon_role_name != "" ? var.neon_role_name : "${local.neon_db_base_name}_app"
  neon_database_name      = var.neon_database_name != "" ? var.neon_database_name : local.neon_db_base_name
  neon_db_branch_name     = trimspace(var.neon_db_branch_name)
  neon_effective_branch_name = local.neon_db_branch_name != "" ? local.neon_db_branch_name : "main"
  neon_database_url       = "postgresql://${neon_role.app.name}:${urlencode(neon_role.app.password)}@${neon_endpoint.app_rw.host}/${neon_database.app.name}?sslmode=require"
}

data "terraform_remote_state" "identity_base" {
  backend = "local"

  config = {
    path = var.identity_base_state_path
  }
}

data "terraform_remote_state" "identity_app" {
  backend = "local"

  config = {
    path = var.identity_app_state_path
  }
}

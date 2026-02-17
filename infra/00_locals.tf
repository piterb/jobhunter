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

  resource_prefix = var.resource_prefix_override != "" ? var.resource_prefix_override : "${var.app_name}-${var.env_name}"

  auth0_domain_clean = trimsuffix(trimprefix(var.auth0_domain, "https://"), "/")
  auth0_domain       = local.auth0_domain_clean
  oidc_issuer_url    = var.oidc_issuer != "" ? var.oidc_issuer : "https://${local.auth0_domain_clean}/"

  auth0_api_name        = var.auth0_api_name_override != "" ? var.auth0_api_name_override : "${var.app_name}-${var.env_name}-api"
  auth0_spa_name        = var.auth0_spa_name_override != "" ? var.auth0_spa_name_override : "${var.app_name}-${var.env_name}-client"
  auth0_api_identifier  = var.oidc_audience != "" ? var.oidc_audience : "https://api.${var.app_name}.${var.env_name}"
  client_redirect_uri   = "${google_cloud_run_v2_service.client.uri}/auth/callback"
  client_logout_uri     = "${google_cloud_run_v2_service.client.uri}/login"
  default_client_allow  = auth0_client.frontend.client_id
  oidc_client_allowlist = var.oidc_client_allowlist != "" ? var.oidc_client_allowlist : local.default_client_allow
  neon_branch_name      = var.neon_branch_name != "" ? var.neon_branch_name : "${var.app_name}-${var.env_name}"
  neon_database_url     = "postgresql://${neon_role.app.name}:${urlencode(neon_role.app.password)}@${neon_endpoint.app_rw.host}/${neon_database.app.name}?sslmode=require"
}

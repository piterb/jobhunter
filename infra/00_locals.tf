locals {
  github_owner = data.external.git_info.result.owner
  github_repo  = data.external.git_info.result.repo

  service_account_id    = "deployer-${var.env_name}"
  service_account_email = "${local.service_account_id}@${var.project_id}.iam.gserviceaccount.com"

  artifact_repo_name = "repo-${var.env_name}"

  server_service_name = "${var.app_name}-server"
  client_service_name = "${var.app_name}-client"

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

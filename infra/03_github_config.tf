# 1. Create GitHub Environment (e.g., tst, prod)
resource "github_repository_environment" "env" {
  environment = var.env_name
  repository  = local.github_repo
}

# (Workflows are managed locally via local_file in 04_github_workflows.tf)

# 2. Define GitHub Actions Variables
resource "github_actions_environment_variable" "vars" {
  for_each = {
    "GCP_PROJECT_ID"                   = var.gcp_project_id
    "GCP_REGION"                       = var.region
    "NEON_PROJECT_ID"                  = var.neon_project_id
    "NEON_DB_BRANCH_NAME"              = local.neon_create_branch ? local.neon_effective_branch_name : local.neon_selected_existing_branch_name
    "ARTIFACT_REPO"                    = "${var.region}-docker.pkg.dev/${var.gcp_project_id}/${local.artifact_repo_name}"
    "APP_NAME"                         = var.app_name
    "SERVER_SERVICE_NAME"              = local.server_service_name
    "CLIENT_SERVICE_NAME"              = local.client_service_name
    "NEXT_PUBLIC_API_URL"              = "${google_cloud_run_v2_service.server.uri}/api/v1"
    "FEEDBACK_ENABLED"                 = var.feedback_enabled
    "NEXT_PUBLIC_FEEDBACK_ENABLED"     = var.feedback_enabled
    "RESOURCE_PREFIX"                  = local.resource_prefix
    "AUTH_PROVIDER"                    = var.auth_provider
    "AUTH_LOCAL_DEV_USE_MOCK_IDENTITY" = tostring(var.auth_local_dev_use_mock_identity)
    "OIDC_ISSUER"                      = local.oidc_issuer_url
    "OIDC_AUDIENCE"                    = local.auth0_api_identifier_resolved
    "OIDC_CLIENT_ALLOWLIST"            = local.oidc_client_allowlist
    "OIDC_ALLOWED_ALGORITHMS"          = var.oidc_allowed_algorithms
    "AUTH_ENFORCE_APP_CLAIMS"          = tostring(var.auth_enforce_app_claims)
    "AUTH_APP_ID_CLAIM"                = var.auth_app_id_claim
    "AUTH_APP_ENV_CLAIM"               = var.auth_app_env_claim
    "AUTH_REQUIRE_CLIENT_ALLOWLIST"    = tostring(var.auth_require_client_allowlist)
    "AUTH_REQUIRED_SCOPES"             = var.auth_required_scopes
    "NEXT_PUBLIC_AUTH_PROVIDER"        = "auth0"
    "NEXT_PUBLIC_AUTH0_DOMAIN"         = local.auth0_domain_clean
    "NEXT_PUBLIC_AUTH0_CLIENT_ID"      = local.auth0_frontend_client_id_resolved
    "NEXT_PUBLIC_AUTH0_AUDIENCE"       = local.auth0_api_identifier_resolved
    "NEXT_PUBLIC_AUTH0_SCOPE"          = var.next_public_auth0_scope
    "NEXT_PUBLIC_AUTH0_REDIRECT_URI"   = local.client_redirect_uri
    "NEXT_PUBLIC_AUTH0_LOGOUT_URL"     = local.client_logout_uri
  }

  repository    = local.github_repo
  environment   = github_repository_environment.env.environment
  variable_name = each.key
  value         = each.value
}

# 3. Define GitHub Actions Secrets
resource "github_actions_environment_secret" "secrets" {
  for_each = {
    "GCP_WIF_PROVIDER"      = google_iam_workload_identity_pool_provider.provider.name
    "GCP_SA_EMAIL"          = google_service_account.deployer.email
    "DATABASE_URL"          = local.neon_database_url
    "FEEDBACK_GITHUB_TOKEN" = var.feedback_github_token
  }

  repository      = local.github_repo
  environment     = github_repository_environment.env.environment
  secret_name     = each.key
  plaintext_value = each.value
}

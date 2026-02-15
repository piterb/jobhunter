# 1. Create GitHub Environment (e.g., tst, prod)
resource "github_repository_environment" "env" {
  environment = var.env_name
  repository  = local.github_repo
}

# 1.5. Create GitHub Actions Workflow File (e.g., deploy-server.yml)
resource "github_repository_file" "deploy_server_workflow" {
  repository          = local.github_repo
  branch              = var.github_branch
  file                = ".github/workflows/deploy-server.yml"
  content = templatefile("${path.module}/templates/deploy-server.yml.tftpl", {
    env_name      = var.env_name
    github_branch = var.github_branch
    app_name      = var.app_name
  })
}

# 2. Define GitHub Actions Variables
resource "github_actions_environment_variable" "vars" {
  for_each = {
    "GCP_PROJECT_ID"      = var.project_id
    "GCP_REGION"          = var.region
    "ARTIFACT_REPO"       = "${var.region}-docker.pkg.dev/${var.project_id}/${local.artifact_repo_name}"
    "APP_NAME"            = var.app_name
    "NEXT_PUBLIC_API_URL" = "${google_cloud_run_v2_service.server.uri}/api/v1"
    "FEEDBACK_ENABLED"    = var.feedback_enabled
    "DB_SCHEMA"                    = local.db_schema
    "RESOURCE_PREFIX"               = local.resource_prefix
    "NEXT_PUBLIC_RESOURCE_PREFIX"   = local.resource_prefix
  }

  repository    = local.github_repo
  environment   = github_repository_environment.env.environment
  variable_name = each.key
  value         = each.value
}

# 3. Define GitHub Actions Secrets
resource "github_actions_environment_secret" "secrets" {
  for_each = {
    "GCP_WIF_PROVIDER"          = google_iam_workload_identity_pool_provider.provider.name
    "GCP_SA_EMAIL"              = google_service_account.deployer.email
    "DATABASE_URL"              = local.database_url
    "SUPABASE_URL"              = local.supabase_url
    "SUPABASE_SERVICE_ROLE_KEY" = data.supabase_apikeys.current.service_role_key
    "NEXT_PUBLIC_SUPABASE_URL"  = local.supabase_url
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = data.supabase_apikeys.current.anon_key
    "FEEDBACK_GITHUB_TOKEN"     = var.feedback_github_token
  }

  repository      = local.github_repo
  environment     = github_repository_environment.env.environment
  secret_name     = each.key
  plaintext_value = each.value
}

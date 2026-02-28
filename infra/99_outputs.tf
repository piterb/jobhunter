# --- GCP Outputs ---
output "server_url" {
  description = "The generated URL for the Server service"
  value       = google_cloud_run_v2_service.server.uri
}

output "client_url" {
  description = "The generated URL for the Client service"
  value       = google_cloud_run_v2_service.client.uri
}

output "wif_provider" {
  description = "Workload Identity Provider path for GitHub Actions"
  value       = google_iam_workload_identity_pool_provider.provider.name
}

output "service_account_email" {
  value = google_service_account.deployer.email
}

# --- GitHub Outputs ---
output "gh_owner" {
  value = local.github_owner
}

output "gh_repo" {
  value = local.github_repo
}

output "gh_environment" {
  description = "The GitHub environment created/updated"
  value       = github_repository_environment.env.environment
}

output "generated_workflows" {
  description = "Paths to the generated GitHub workflow files"
  value = [
    local_file.server_workflow.filename,
    local_file.client_workflow.filename
  ]
}

output "resource_prefix" {
  description = "Prefix used for runtime resources (e.g. bucket names)"
  value       = local.resource_prefix
}

output "documents_bucket_name" {
  value = google_storage_bucket.documents.name
}

output "avatars_bucket_name" {
  value = google_storage_bucket.avatars.name
}

output "feedback_bucket_name" {
  value = google_storage_bucket.feedback_reports.name
}

output "auth_base_url" {
  description = "Identity provider base URL used by runtime"
  value       = local.keycloak_base_url
}

output "auth_realm" {
  description = "Identity provider realm used by runtime"
  value       = local.keycloak_realm
}

output "oidc_issuer" {
  description = "OIDC issuer URL for backend runtime"
  value       = local.oidc_issuer_url
}

output "oidc_audience" {
  description = "OIDC audience for backend/client runtime"
  value       = local.oidc_audience_value
}

output "oidc_client_allowlist" {
  description = "Resolved OIDC client allowlist used by backend policy"
  value       = local.oidc_client_allowlist
}

output "auth_frontend_client_id" {
  description = "Resolved SPA client ID used by this environment"
  value       = local.auth_frontend_client_id
}

output "client_auth_callback_url" {
  description = "Frontend callback URL configured for the SPA app"
  value       = local.client_redirect_uri
}

output "client_auth_logout_url" {
  description = "Frontend logout URL configured for the SPA app"
  value       = local.client_logout_uri
}

output "neon_project_id" {
  description = "Neon project id configured for this environment"
  value       = var.neon_project_id
}

output "neon_branch_id" {
  description = "Neon branch used for app database resources"
  value       = local.neon_create_branch ? neon_branch.db_host[0].id : local.neon_selected_existing_branch_id
}

output "neon_branch_name" {
  description = "Neon branch name used for app database resources"
  value       = local.neon_create_branch ? local.neon_effective_branch_name : local.neon_selected_existing_branch_name
}

output "neon_role_name" {
  description = "Neon role created by Terraform"
  value       = neon_role.app.name
}

output "neon_database_name" {
  description = "Neon database created by Terraform"
  value       = neon_database.app.name
}

output "neon_endpoint_host" {
  description = "Neon read-write endpoint host created by Terraform"
  value       = neon_endpoint.app_rw.host
}

output "neon_database_url" {
  description = "Neon connection URI derived from Terraform-managed Neon resources"
  value       = local.neon_database_url
  sensitive   = true
}

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

# --- Supabase Outputs (Non-sensitive only) ---
output "supabase_api_url" {
  description = "The Supabase API URL being used"
  value       = local.supabase_url
}

output "supabase_project_ref" {
  value = var.supabase_project_ref
}

output "supabase_google_callback_url" {
  description = "The URL to add to your Google Cloud Console OAuth Authorized Redirect URIs"
  value       = "https://${var.supabase_project_ref}.supabase.co/auth/v1/callback"
}

output "debug_google_id_exists" {
  description = "DEBUG: Check if google_client_id is loaded"
  value       = var.google_client_id != "" ? "YES (length: ${length(var.google_client_id)})" : "NO - IT IS EMPTY"
}

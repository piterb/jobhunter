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

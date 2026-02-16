locals {
  github_owner = data.external.git_info.result.owner
  github_repo  = data.external.git_info.result.repo

  service_account_id    = "deployer-${var.env_name}"
  service_account_email = "${local.service_account_id}@${var.project_id}.iam.gserviceaccount.com"

  artifact_repo_name = "repo-${var.env_name}"

  server_service_name = "${var.app_name}-server"
  client_service_name = "${var.app_name}-client"

  resource_prefix = var.resource_prefix_override != "" ? var.resource_prefix_override : "${var.app_name}-${var.env_name}"
}

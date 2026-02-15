locals {
  github_owner        = data.external.git_info.result.owner
  github_repo         = data.external.git_info.result.repo
  
  service_account_id  = "deployer-${var.env_name}"
  service_account_email = "${local.service_account_id}@${var.project_id}.iam.gserviceaccount.com"
  
  artifact_repo_name  = "repo-${var.env_name}"
  
  server_service_name = "${var.app_name}-server"
  client_service_name = "${var.app_name}-client"
  
  # Derived Supabase URLs
  db_schema            = "${var.app_name}_${var.env_name}"
  resource_prefix      = "${var.app_name}_${var.env_name}"
  supabase_url         = "https://${var.supabase_project_ref}.supabase.co"
  
  # For Migrations and PSQL (Standard port 5432 is more reliable in CI environments)
  database_url = "postgresql://postgres:${var.db_password}@db.${var.supabase_project_ref}.supabase.co:5432/postgres"
}

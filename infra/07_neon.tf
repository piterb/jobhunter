resource "neon_branch" "app" {
  project_id = var.neon_project_id
  name       = local.neon_branch_name
}

resource "neon_role" "app" {
  project_id = var.neon_project_id
  branch_id  = neon_branch.app.id
  name       = var.neon_role_name
}

resource "neon_database" "app" {
  project_id = var.neon_project_id
  branch_id  = neon_branch.app.id
  name       = var.neon_database_name
  owner_name = neon_role.app.name
}

resource "neon_endpoint" "app_rw" {
  project_id = var.neon_project_id
  branch_id  = neon_branch.app.id
  type       = "read_write"
}

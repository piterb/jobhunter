data "neon_branches" "project" {
  project_id = var.neon_project_id
}

locals {
  neon_existing_branch_ids = [
    for branch in data.neon_branches.project.branches : branch.id
    if branch.name == local.neon_db_branch_name
  ]
  neon_existing_branch_id = try(one(local.neon_existing_branch_ids), null)
}

resource "neon_branch" "db_host" {
  count = local.neon_should_create_branch && local.neon_existing_branch_id == null ? 1 : 0

  project_id = var.neon_project_id
  name       = local.neon_db_branch_name
}

resource "neon_role" "app" {
  lifecycle {
    precondition {
      condition     = local.neon_should_create_branch || local.neon_existing_branch_id != null
      error_message = "Configured Neon branch was not found. Set neon_db_branch_name to create/use a custom branch, or leave it empty to use existing 'main'."
    }
  }

  project_id = var.neon_project_id
  branch_id  = local.neon_should_create_branch && local.neon_existing_branch_id == null ? neon_branch.db_host[0].id : local.neon_existing_branch_id
  name       = local.neon_role_name
}

resource "neon_database" "app" {
  lifecycle {
    precondition {
      condition     = local.neon_should_create_branch || local.neon_existing_branch_id != null
      error_message = "Configured Neon branch was not found. Set neon_db_branch_name to create/use a custom branch, or leave it empty to use existing 'main'."
    }
  }

  project_id = var.neon_project_id
  branch_id  = local.neon_should_create_branch && local.neon_existing_branch_id == null ? neon_branch.db_host[0].id : local.neon_existing_branch_id
  name       = local.neon_database_name
  owner_name = neon_role.app.name
}

resource "neon_endpoint" "app_rw" {
  lifecycle {
    precondition {
      condition     = local.neon_should_create_branch || local.neon_existing_branch_id != null
      error_message = "Configured Neon branch was not found. Set neon_db_branch_name to create/use a custom branch, or leave it empty to use existing 'main'."
    }
  }

  project_id = var.neon_project_id
  branch_id  = local.neon_should_create_branch && local.neon_existing_branch_id == null ? neon_branch.db_host[0].id : local.neon_existing_branch_id
  type       = "read_write"
}

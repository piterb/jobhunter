data "neon_branches" "project" {
  project_id = var.neon_project_id
}

locals {
  neon_requested_branch_name = local.neon_db_branch_name
  neon_effective_branch_name = local.neon_requested_branch_name != "" ? local.neon_requested_branch_name : "main"

  neon_primary_branch_ids = [
    for branch in data.neon_branches.project.branches : branch.id
    if try(branch.primary, false) || try(branch.default, false) || try(branch.is_default, false)
  ]
  neon_primary_branch_id = try(one(local.neon_primary_branch_ids), null)
  neon_primary_branch_name = try(one([
    for branch in data.neon_branches.project.branches : branch.name
    if try(branch.primary, false) || try(branch.default, false) || try(branch.is_default, false)
  ]), null)

  neon_named_branch_ids = [
    for branch in data.neon_branches.project.branches : branch.id
    if branch.name == local.neon_db_branch_name
  ]
  neon_named_branch_id = try(one(local.neon_named_branch_ids), null)

  neon_main_branch_ids = [
    for branch in data.neon_branches.project.branches : branch.id
    if branch.name == "main"
  ]
  neon_main_branch_id = try(one(local.neon_main_branch_ids), null)

  neon_effective_named_branch_ids = [
    for branch in data.neon_branches.project.branches : branch.id
    if branch.name == local.neon_effective_branch_name
  ]
  neon_effective_named_branch_id = try(one(local.neon_effective_named_branch_ids), null)

  neon_first_branch_id   = try(data.neon_branches.project.branches[0].id, null)
  neon_first_branch_name = try(data.neon_branches.project.branches[0].name, null)

  neon_fallback_branch_id = try(coalesce(local.neon_primary_branch_id, local.neon_main_branch_id, local.neon_first_branch_id), null)

  neon_selected_existing_branch_id = local.neon_requested_branch_name != "" ? local.neon_named_branch_id : local.neon_fallback_branch_id
  neon_selected_existing_branch_name = try(one([
    for branch in data.neon_branches.project.branches : branch.name
    if branch.id == local.neon_selected_existing_branch_id
  ]), try(coalesce(local.neon_primary_branch_name, local.neon_first_branch_name), null))

  neon_create_branch = local.neon_selected_existing_branch_id == null
}

resource "neon_branch" "db_host" {
  count = local.neon_create_branch ? 1 : 0

  project_id = var.neon_project_id
  name       = local.neon_effective_branch_name
}

resource "neon_role" "app" {
  project_id = var.neon_project_id
  branch_id  = local.neon_create_branch ? neon_branch.db_host[0].id : local.neon_selected_existing_branch_id
  name       = local.neon_role_name
}

resource "neon_database" "app" {
  project_id = var.neon_project_id
  branch_id  = local.neon_create_branch ? neon_branch.db_host[0].id : local.neon_selected_existing_branch_id
  name       = local.neon_database_name
  owner_name = neon_role.app.name
}

resource "neon_endpoint" "app_rw" {
  project_id = var.neon_project_id
  branch_id  = local.neon_create_branch ? neon_branch.db_host[0].id : local.neon_selected_existing_branch_id
  type       = "read_write"
}

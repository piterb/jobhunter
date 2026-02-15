# Auto-detect GitHub info from local git remote
data "external" "git_info" {
  program = ["sh", "-c", "git remote get-url origin | sed -E 's/.*github.com[:/]([^/]+)\\/([^.]+).*/{\"owner\":\"\\1\", \"repo\":\"\\2\"}/'"]
}

# Fetch secrets and keys from Supabase project (requires Supabase Access Token)
data "supabase_project" "current" {
  ref = var.supabase_project_ref
}

# Get Google Cloud Project number (needed for WIF principal construction)
data "google_project" "project" {
}

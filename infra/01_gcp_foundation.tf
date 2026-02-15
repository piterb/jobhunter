# 1. Enable required Google Cloud APIs
resource "google_project_service" "services" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "iam.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "iamcredentials.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}

# 2. Artifact Registry (Storage for Docker images)
resource "google_artifact_registry_repository" "repo" {
  depends_on    = [google_project_service.services]
  location      = var.region
  repository_id = local.artifact_repo_name
  format        = "DOCKER"
  description   = "Docker repository for ${var.env_name} environment"

  # Cleanup policy: Keep only latest 3 images
  cleanup_policies {
    id     = "keep-recent-3"
    action = "KEEP"
    most_recent_versions {
      keep_count = 3
    }
  }

  # Cleanup policy: Delete images older than 1 hour
  cleanup_policies {
    id     = "delete-old-images"
    action = "DELETE"
    condition {
      older_than = "3600s" # 1 hour
    }
  }
}

# 3. Service Account for GitHub Deployment
resource "google_service_account" "deployer" {
  depends_on   = [google_project_service.services]
  account_id   = local.service_account_id
  display_name = "GitHub Deployer (${var.env_name})"
}

# 4. Assign IAM Roles to Service Account
resource "google_project_iam_member" "roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer",
    "roles/secretmanager.secretAccessor",
    "roles/secretmanager.admin",
    "roles/iam.serviceAccountTokenCreator"
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# 5. Workload Identity Federation (Secure connection for GitHub)
resource "google_iam_workload_identity_pool" "pool" {
  depends_on                = [google_project_service.services]
  workload_identity_pool_id = "github-pool-${var.env_name}"
  display_name              = "GitHub Pool (${var.env_name})"
}

resource "google_iam_workload_identity_pool_provider" "provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider-${var.env_name}"
  display_name                       = "GitHub Provider (${var.env_name})"
  
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
  
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Bind WIF to Service Account and specific GitHub Repository
resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.pool.name}/attribute.repository/${local.github_owner}/${local.github_repo}"
}

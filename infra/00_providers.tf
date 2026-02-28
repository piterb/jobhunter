terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.13"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

provider "github" {
  owner = local.github_owner
}

provider "neon" {
  api_key = var.neon_api_key
}

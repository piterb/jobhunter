resource "google_storage_bucket" "documents" {
  name                        = "${local.resource_prefix}-documents"
  location                    = var.gcs_location
  uniform_bucket_level_access = true
  force_destroy               = false
}

resource "google_storage_bucket" "avatars" {
  name                        = "${local.resource_prefix}-avatars"
  location                    = var.gcs_location
  uniform_bucket_level_access = true
  force_destroy               = false
}

resource "google_storage_bucket" "feedback_reports" {
  name                        = "${local.resource_prefix}-feedback-reports"
  location                    = var.gcs_location
  uniform_bucket_level_access = true
  force_destroy               = false
}

resource "google_storage_bucket_iam_member" "avatars_public_read" {
  bucket = google_storage_bucket.avatars.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "feedback_reports_public_read" {
  bucket = google_storage_bucket.feedback_reports.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

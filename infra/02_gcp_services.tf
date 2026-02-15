# 1. Server Service (Bootstrap with Hello World)
resource "google_cloud_run_v2_service" "server" {
  depends_on = [google_project_service.services]
  name       = local.server_service_name
  location   = var.region
  ingress    = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
    }
  }

  # This allows the first deploy to succeed even if the real image isn't built yet
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# 2. Client Service (Bootstrap with Hello World)
resource "google_cloud_run_v2_service" "client" {
  depends_on = [google_project_service.services]
  name       = local.client_service_name
  location   = var.region
  ingress    = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
    }
  }

  # This allows the first deploy to succeed even if the real image isn't built yet
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# 3. Allow Public Access (allUsers)
resource "google_cloud_run_v2_service_iam_member" "server_public" {
  location = google_cloud_run_v2_service.server.location
  name     = google_cloud_run_v2_service.server.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "client_public" {
  location = google_cloud_run_v2_service.client.location
  name     = google_cloud_run_v2_service.client.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 1. Supabase Project Settings (Auth & Redirects)
resource "supabase_settings" "project_config" {
  project_ref = var.supabase_project_ref

  auth = jsonencode({
    site_url = google_cloud_run_v2_service.client.uri
    
    additional_redirect_urls = concat(
      var.auth_additional_redirect_urls,
      [
        "${google_cloud_run_v2_service.client.uri}/**",
        "http://localhost:3000/**"
      ]
    )

    external_google = {
      enabled       = var.google_client_id != "" ? true : false
      client_id     = var.google_client_id
      secret        = var.google_client_secret
      skip_nonce_check = true
    }
  })

  api = jsonencode({
    db_schema = join(",", compact([
      "public",
      "storage",
      "graphql_public",
      local.db_schema,
      var.extra_exposed_schemas
    ]))
  })
}

# 1. Supabase Project Settings (Auth & Redirects)
resource "supabase_settings" "project_config" {
  project_ref = var.supabase_project_ref

  auth = jsonencode({
    site_url = var.supabase_site_url != "" ? var.supabase_site_url : google_cloud_run_v2_service.client.uri
    
    additional_redirect_urls = distinct(compact(concat(
      var.auth_additional_redirect_urls,
      [
        "${trimsuffix(google_cloud_run_v2_service.client.uri, "/")}/**",
        "http://localhost:3000/**"
      ]
    )))

    # Formát pre Supabase Management API (GoTrue settings)
    external_google_enabled          = var.google_client_id != "" ? true : false
    external_google_client_id        = var.google_client_id
    external_google_secret           = var.google_client_secret
    external_google_skip_nonce_check = true
  })

  api = jsonencode({
    # Spoji defaultne schemy, tvoju novu schemu a extra schemy z common.tfvars
    db_schema = join(",", distinct(compact(concat(
      ["public", "storage", "graphql_public", local.db_schema],
      split(",", replace(var.extra_exposed_schemas, " ", ""))
    ))))
  })
}

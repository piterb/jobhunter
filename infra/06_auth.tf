resource "terraform_data" "auth_runtime_guardrails" {
  lifecycle {
    precondition {
      condition     = trimspace(local.oidc_audience_value) != ""
      error_message = "OIDC audience could not be resolved from identity_app_state_path or explicit oidc_audience."
    }

    precondition {
      condition     = trimspace(local.auth_frontend_client_id) != ""
      error_message = "SPA client id could not be resolved from identity_app_state_path."
    }

    precondition {
      condition     = trimspace(local.keycloak_base_url) != ""
      error_message = "Keycloak base URL could not be resolved from identity_base_state_path."
    }

    precondition {
      condition     = trimspace(local.keycloak_realm) != ""
      error_message = "Keycloak realm could not be resolved from identity_base_state_path."
    }
  }
}

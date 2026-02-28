output "keycloak_url" {
  description = "Keycloak base URL shared with app stacks"
  value       = var.keycloak_url
}

output "keycloak_client_id" {
  description = "Terraform client id shared with app stacks"
  value       = var.keycloak_client_id
}

output "keycloak_client_secret" {
  description = "Terraform client secret shared with app stacks"
  value       = var.keycloak_client_secret
  sensitive   = true
}

output "realm_name" {
  description = "Target realm used by this stack"
  value       = data.keycloak_realm.target.realm
}

output "environment" {
  description = "Environment label shared with app stacks"
  value       = var.environment
}

output "realm_name" {
  description = "Target realm used by this stack"
  value       = data.keycloak_realm.target.realm
}

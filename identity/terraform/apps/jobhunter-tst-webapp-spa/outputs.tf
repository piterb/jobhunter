output "jobhunter_tst_webapp_spa_spa_client_id" {
  description = "SPA client id for jobhunter-tst-webapp-spa"
  value       = keycloak_openid_client.jobhunter_tst_webapp_spa_spa.client_id
}

output "jobhunter_tst_webapp_spa_api_client_id" {
  description = "API client id for jobhunter-tst-webapp-spa"
  value       = keycloak_openid_client.jobhunter_tst_webapp_spa_api.client_id
}

output "spa_client_id" {
  description = "Generic SPA client id contract for consumer stacks"
  value       = keycloak_openid_client.jobhunter_tst_webapp_spa_spa.client_id
}

output "api_client_id" {
  description = "Generic API client id contract for consumer stacks"
  value       = keycloak_openid_client.jobhunter_tst_webapp_spa_api.client_id
}

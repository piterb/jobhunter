# 1. Generate Server Workflow
resource "local_file" "server_workflow" {
  filename = "${path.module}/../.github/workflows/deploy-server-${var.env_name}.yml"
  content = templatefile("${path.module}/templates/deploy-server.yml.tftpl", {
    env_name      = var.env_name
    github_branch = var.github_branch
    app_name      = var.app_name
  })
}

# 2. Generate Client Workflow
resource "local_file" "client_workflow" {
  filename = "${path.module}/../.github/workflows/deploy-client-${var.env_name}.yml"
  content = templatefile("${path.module}/templates/deploy-client.yml.tftpl", {
    env_name      = var.env_name
    github_branch = var.github_branch
  })
}

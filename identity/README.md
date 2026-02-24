# Keycloak Identity Bootstrap

This folder contains a GitHub-driven Terraform setup split by stacks:
- base stack: `identity/terraform/base`
- app stacks: `identity/terraform/apps/<app-name>`

The realm is expected to already exist and be managed by the platform team.

## Quickstart

1. Configure repository secrets:
   - `KEYCLOAK_URL`
   - `KEYCLOAK_CLIENT_ID`
   - `KEYCLOAK_CLIENT_SECRET`
2. Review `identity/terraform/base/terraform.tfvars.example` and copy to `terraform.tfvars` when needed.
3. Add first app stack:
   - `kcadmin app-add --profile spa-api --name web`
4. Open PR and review per-stack plans in GitHub Actions.

## Defaults from bootstrap

- realm: `jobhunter-tst`
- environment: `tst`
- folder: `identity`

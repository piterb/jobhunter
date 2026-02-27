# Keycloak Identity Bootstrap

This folder contains a local-first Terraform setup split by stacks:
- base stack: `identity/terraform/base`
- app stacks: `identity/terraform/apps/<app-name>`

The realm is expected to already exist and be managed by the platform team.

## Quickstart

1. Review `identity/terraform/base/terraform.tfvars.example` and copy to `terraform.tfvars`.
2. Run local Terraform plan/apply in base stack:
   - `cd identity/terraform/base`
   - `terraform init`
   - `cp terraform.tst.tfvars.example terraform.tst.tfvars`
   - `terraform plan -var-file=terraform.tst.tfvars -state=terraform.tst.tfstate`
   - `terraform apply -var-file=terraform.tst.tfvars -state=terraform.tst.tfstate`
3. Add first app stack:
   - `kcadmin app-add --profile spa-api --name web`
4. Run local Terraform plan/apply in the app stack you changed.

## Defaults from bootstrap

- realm: `jobhunter-tst`
- environment: `tst`
- folder: `identity`

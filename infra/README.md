# 🚀 Terraform Infrastructure Guide

This guide describes how to manage the project infrastructure using Terraform.

## 📦 Prerequisites

Ensure you have the following tools, accounts, and access prepared:

1.  **Terraform**: 
    ```bash
    # Check if already installed:
    terraform -v
    
    # If not installed, or to resolve tap conflicts:
    brew uninstall terraform # if already present from homebrew/core
    brew tap hashicorp/tap
    brew install hashicorp/tap/terraform
    ```
2.  **Google Cloud SDK (gcloud)**: [Install Guide](https://cloud.google.com/sdk/docs/install)
3.  **GitHub CLI (gh)**: `brew install gh`
4.  **Git**: Should be installed and configured on your machine.
5.  **Google Cloud Account**: An active GCP account with billing enabled.
6.  **Keycloak Identity State**: The shared identity stack and app identity stack must already exist and produce Terraform state consumable by `infra/`.
7.  **Neon Project**: Created manually (Terraform does not create the Neon project itself).
8.  **Neon project-scoped API key**: For that specific project.

Verify installation: `terraform -v && gcloud --version && gh --version`

## ⚙️ Configuration (Preparation)

Before the first run, you must prepare your environment:

This Terraform supports multiple isolated app/env stacks inside one GCP project.
Isolation in GCP is based on unique `<app_name>-<env_name>` naming for Cloud Run, Artifact Registry, buckets, service account, and WIF resources.

### 1. Manual Steps (One-time)
*   **Create GCP Project**: Create a new project manually in the [GCP Console](https://console.cloud.google.com/). 
    *   *Note: These scripts manage resources within an existing project, they do not create the project itself to avoid complex billing/organization permission issues.*
*   **Enable Billing**: Ensure the project has a Billing Account attached.
*   **Create Neon Project** manually in [Neon Console](https://console.neon.tech/).
*   **Create Neon project-scoped API key** with permissions to manage branches/roles/databases/endpoints inside that project.
*   **Copy Neon Project ID** (used as `neon_project_id` in tfvars).
*   **Identify GitHub coordinates** for this repo:
    *   `github_owner` and `github_repo` from repository URL `https://github.com/<owner>/<repo>`
    *   `github_branch` used for deployment trigger in this stack
*   **Prepare identity stack states** (manual, outside `infra/`):
    *   Apply the shared Keycloak base stack in `identity/terraform/base`.
    *   Apply the app-specific Keycloak stack in `identity/terraform/apps/<app-name>`.
    *   Verify the base state exports `keycloak_url` and `realm_name`.
    *   Verify the app state exports `spa_client_id` and `api_client_id`.

### 2. Local CLI Authentication
You must be logged into the CLI tools on your machine:
*   **Google Cloud**: `gcloud auth application-default login`
*   **GitHub**: `gh auth login`

### 3. Variable Preparation
You need to prepare two variable files:

1.  **Common Environment Settings**:
    Copy `environments/common.example.tfvars` to `environments/common.tfvars` (it can stay empty).

2.  **Specific Environment**:
    Copy `environments/example.tfvars` to `environments/tst2.tfvars` and fill in project-specific IDs.
    The template is split by systems/providers (`GCP`, `GitHub`, `Neon`, `Identity`, runtime policy).
    Fill required keys first: `app_name`, `env_name`, `gcp_project_id`, `github_owner`, `github_repo`, `github_branch`, `neon_project_id`, `neon_api_key`, `identity_base_state_path`, `identity_app_state_path`.
    Neon model in shared project: one shared branch and isolated resources per app/env (`database + role + endpoint`).
    `neon_db_branch_name` behavior:
    - empty/commented => use existing Neon default (primary) branch
    - set value => use that branch and auto-create it if missing
    Most advanced auth/OIDC overrides are intentionally commented out in the template; keep defaults unless you have a specific reason to change them.
    Terraform derives runtime Keycloak/OIDC values from identity Terraform state and exports them to GitHub environment variables.
    Terraform provisions Neon resources inside the existing project (branch/database/role/endpoint) and writes derived connection URI into the `DATABASE_URL` GitHub secret automatically.
    Migration table naming is environment-scoped: `<app_name>_<env_name>_schema_migrations`.

### 3. Neon Isolation Notes
*   Primary isolation is `database + role` per `<app_name, env_name>` in the selected Neon branch.
*   Terraform provider creates role-owned DB and dedicated endpoint credentials per stack.
*   Provider does not expose explicit SQL `GRANT/REVOKE CONNECT` resources across databases. For hard isolation guarantees beyond role/database ownership, use dedicated Neon project per app/env (recommended for production).

### 4. Preflight Checklist (Before `terraform plan/apply`)
Confirm all items:
*   `gcp_project_id` exists in GCP and billing is enabled.
*   Combination `app_name + env_name` is unique for this stack within the same GCP project.
*   `github_owner`, `github_repo`, and `github_branch` are correct for target repository/workflow.
*   `neon_project_id` exists in Neon (created manually).
*   `neon_api_key` is project-scoped for that Neon project.
*   If `neon_db_branch_name` is empty/commented, Neon project has an existing default (primary) branch.
*   If `neon_db_branch_name` is set, Terraform will use that branch and auto-create it when missing.
*   `identity_base_state_path` points to an existing state file with `keycloak_url` and `realm_name`.
*   `identity_app_state_path` points to an existing state file with `spa_client_id` and `api_client_id`.
*   `gh auth status` and `gcloud auth application-default print-access-token` both work locally.

## 🛠 Quick Start (First Run)

Run all commands inside the `infra/` directory.

1.  **Initialization** (downloading providers):
    ```bash
    terraform init
    ```

2.  **Review Changes** (plan):
    ```bash
    terraform plan \
      -var-file="environments/common.tfvars" \
      -var-file="environments/tst2.tfvars"
    ```

3.  **Apply Changes** (execution):
    ```bash
    terraform apply \
      -var-file="environments/common.tfvars" \
      -var-file="environments/tst2.tfvars"
    ```
    *(Type `yes` when prompted)*

4.  **Activate Deployment**:
    After a successful Terraform run, push the generated workflows to GitHub:
    ```bash
    git add ../.github/workflows/
    git commit -m "infra: update terraform generated workflows"
    git push
    ```

---

## 💡 Useful & "Pro" Commands

Here are commands that will be helpful for daily work and debugging:

### 1. Working with State
*   **Show current infrastructure**:
    ```bash
    terraform show  # Prints everything Terraform is currently managing
    ```
*   **List managed resources**:
    ```bash
    terraform state list  # Short list of all components (Cloud Run, Registry, etc.)
    ```

### 2. Forced Fixes
*   **Regenerate a specific file**:
    If you accidentally deleted a YAML workflow and want to restore it without running the full plan:
    ```bash
    terraform apply -replace="local_file.server_workflow" -var-file="environments/tst.tfvars"
    ```
*   **Reset "Hello World" bootstrap**:
    If you want to revert Cloud Run to the original Hello World image for any reason:
    ```bash
    terraform apply -replace="google_cloud_run_v2_service.server" -var-file="environments/tst.tfvars"
    ```

### 3. Visualization and Diagnostics
*   **Dependency Graph**:
    Generates a visual tree of component dependencies (output is in DOT format):
    ```bash
    terraform graph | pbcopy  # Copies the graph (you can paste it into an online Graphviz tool)
    ```

### 4. Variables from Terminal (Security)
If you don't want to keep passwords in the `.tfvars` file, you can pass them directly to the command:
```bash
terraform apply \
  -var="gcp_project_id=your-gcp-project-id" \
  -var="github_owner=your-org-or-user" \
  -var="github_repo=your-repo" \
  -var="neon_project_id=empty-brook-12345678" \
  -var="neon_api_key=napi_xxx" \
  -var-file="environments/tst.tfvars"
```
*(Note: Terraform prioritizes `-var` over values in the file)*

### 5. Complete Wipe (Destroy)
When you no longer need the test environment and want to clean up everything in Google Cloud (and save costs):
```bash
terraform destroy -var-file="environments/tst.tfvars"
```

---

## 📂 File Structure for Orientation
*   `00_...` : Configuration, providers, variables, and locals.
*   `01_...` : Foundation GCP infrastructure (APIs, Registry, IAM, WIF).
*   `02_...` : Cloud Run services (Bootstrap).
*   `03_...` : GitHub Secrets and Variables.
*   `04_...` : GitHub workflow generation from templates.
*   `99_...` : Final summary (URLs and metadata).

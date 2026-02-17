# 🚀 Terraform Infrastructure Guide

This guide describes how to manage the project infrastructure using Terraform.

## 📦 Prerequisites

Ensure you have the following tools installed and configured:

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
6.  **Auth0 Tenant** (for production auth), with a Machine-to-Machine app credential for Terraform provider access.
7.  **Neon Project created manually** (Terraform does not create Neon project itself).
8.  **Neon project-scoped API key** for that project.

Verify installation: `terraform -v && gcloud --version && gh --version`

## ⚙️ Configuration (Preparation)

Before the first run, you must prepare your environment:

### 1. Manual Steps (One-time)
*   **Create GCP Project**: Create a new project manually in the [GCP Console](https://console.cloud.google.com/). 
    *   *Note: These scripts manage resources within an existing project, they do not create the project itself to avoid complex billing/organization permission issues.*
*   **Enable Billing**: Ensure the project has a Billing Account attached.
*   **Create Neon Project** manually in [Neon Console](https://console.neon.tech/).
*   **Create Neon project-scoped API key** with permissions to manage branches/roles/databases/endpoints inside that project.
*   **Copy Neon Project ID** (used as `neon_project_id` in tfvars).

### 1. Authentication
You must be logged into the CLI tools on your machine:
*   **Google Cloud**: `gcloud auth application-default login`
*   **GitHub**: `gh auth login`

### 2. Variable Preparation
You need to prepare two variable files:

1.  **Common Environment Settings**:
    Copy `environments/common.example.tfvars` to `environments/common.tfvars` (it can stay empty).

2.  **Specific Environment**:
    Copy `environments/example.tfvars` to `environments/tst2.tfvars` and fill in project-specific IDs.
    The template includes Neon provider inputs (`neon_api_key`, `neon_project_id`, branch/role/db names) and snake_case mirrors for runtime auth env names from `server/.env.example` and `client/.env.example`.
    If `neon_branch_name` is empty, Terraform uses `<app_name>-<env_name>` to avoid collisions with existing `main` branch.
    Terraform provisions Auth0 API + SPA artifacts and exports the resulting runtime values to GitHub environment variables automatically.
    Terraform provisions Neon resources inside the existing project (branch/database/role/endpoint) and writes derived connection URI into the `DATABASE_URL` GitHub secret automatically.

### 3. Preflight Checklist (Before `terraform plan/apply`)
Confirm all items:
*   `project_id` exists in GCP and billing is enabled.
*   `neon_project_id` exists in Neon (created manually).
*   `neon_api_key` is project-scoped for that Neon project.
*   `auth0_domain`, `auth0_terraform_client_id`, `auth0_terraform_client_secret` are valid.
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
terraform apply -var="neon_api_key=napi_xxx" -var="neon_project_id=empty-brook-12345678" -var-file="environments/tst.tfvars"
```
*(Note: Terraform prioritizes `-var` over values in the file)*

### 5. Complete Wipe (Destroy)
When you no longer need the test environment and want to clean up everything in Google Cloud (and save costs):
```bash
terraform destroy -var-file="environments/tst.tfvars"
```

---

## 📂 File Structure for Orientation
*   `00_...` : Configuration, variables, and data-loading.
*   `01_...` : Foundation GCP infrastructure (APIs, Registry, IAM, WIF).
*   `02_...` : Cloud Run services (Bootstrap).
*   `03_...` : GitHub Secrets and Variables.
*   `04_...` : GitHub workflow generation from templates.
*   `99_...` : Final summary (URLs and metadata).

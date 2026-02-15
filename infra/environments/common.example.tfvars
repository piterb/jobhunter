# Common configuration shared across all test/staging environments.
# Copy this to 'common.tfvars' and adapt as needed.
# This file should contain settings that apply to the entire Supabase project
# regardless of which specific environment (tst, tst2, etc.) is being deployed.

# 1. Additional Redirect URLs
# List here URLs from other environments that should remain authorized in Supabase.
# The current environment's URL and localhost are added automatically by the script.
auth_additional_redirect_urls = [
  "https://jobhunter-client-tst.a.run.app/**",
  "https://jobhunter-client-staging.a.run.app/**"
]

# 2. Extra Exposed Schemas
# List here schemas from other environments that should remain accessible via the Data API.
# The 'public', 'storage', and the current environment's schema are added automatically.
# Example: "jobhunter_tst,jobhunter_staging"
extra_exposed_schemas = ""

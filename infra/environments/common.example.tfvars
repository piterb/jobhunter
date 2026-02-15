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

# Example: "jobhunter_tst,jobhunter_staging"
extra_exposed_schemas = ""

# 3. Main Site URL
# The primary URL of your project (e.g. production or primary test)
# This will be set as 'Site URL' in Supabase Auth settings.
supabase_site_url = "https://your-main-app-url.com"

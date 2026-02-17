# Auto-detect GitHub info from local git remote
data "external" "git_info" {
  program = ["sh", "-c", "git remote get-url origin | sed -E 's/.*github.com[:/]([^/]+)\\/([^.]+).*/{\"owner\":\"\\1\", \"repo\":\"\\2\"}/'"]
}

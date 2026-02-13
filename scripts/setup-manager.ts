import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import boxen from 'boxen';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// --- CONFIGURATION Types ---
interface EnvironmentConfig {
    name: string;        // e.g. "tst", "prod"
    branch: string;      // e.g. "tst", "main"
    projectId: string;   // e.g. "jobhunter-tst"
    region: string;
    repoName: string;
    serviceAccountName: string;
    workloadIdPool: string;
    workloadIdProvider: string;
    wifProviderPath?: string; // Saved after setup
}

interface DeploymentConfig {
    projectBaseName: string; // e.g. "jobhunter"
    githubRepo: string;
    environments: { [key: string]: EnvironmentConfig };
}

// --- CONSTANTS ---
const DEPLOY_CONFIG_FILE = 'deployment-config.json';
const IS_DRY_RUN = process.argv.includes('--dry-run');

// --- HELPER: Execute or Simulate ---
async function runCmd(command: string, args: string[], options: any = {}) {
    if (IS_DRY_RUN) {
        console.log(chalk.gray(`[DRY-RUN] Executing: ${command} ${args.join(' ')}`));
        return { stdout: '' };
    }
    return execa(command, args, options);
}

// --- HELPER: Write File or Simulate ---
function writeFile(filePath: string, content: string) {
    if (IS_DRY_RUN) {
        console.log(chalk.gray(`[DRY-RUN] Writing to ${filePath}:\n${content.substring(0, 50)}...`));
        return;
    }
    fs.outputFileSync(filePath, content);
}

// --- HELPER: System Check ---
async function checkSystemRequirements() {
    console.log(chalk.bold('\n📋 SYSTEM CHECK'));
    console.log(chalk.gray('-------------------------------------'));

    const checks = [
        { name: 'Node.js', cmd: ['node', '-v'], required: true, hint: 'Install from nodejs.org' },
        { name: 'Git', cmd: ['git', '--version'], required: true, hint: 'Install git' },
        { name: 'gcloud CLI', cmd: ['gcloud', '--version'], required: true, hint: 'Install Google Cloud SDK' },
        { name: 'GitHub CLI (gh)', cmd: ['gh', '--version'], required: false, hint: 'Recommended for automatic secrets (brew install gh)' },
        { name: 'Docker', cmd: ['docker', '--version'], required: false, hint: 'Optional (for local builds)' },
    ];

    let missingRequired = false;
    let hasGh = false;

    for (const check of checks) {
        try {
            const { stdout } = await execa(check.cmd[0], check.cmd.slice(1));
            // Parse version (usually first line)
            const version = stdout.split('\n')[0].replace(check.name, '').trim();
            console.log(`${chalk.green('✅')} ${check.name.padEnd(15)} ${chalk.green(version)}`);
            if (check.name === 'GitHub CLI (gh)') hasGh = true;
        } catch {
            if (check.required) {
                console.log(`${chalk.red('❌')} ${check.name.padEnd(15)} ${chalk.red('Missing')}  (${check.hint})`);
                missingRequired = true;
            } else {
                console.log(`${chalk.yellow('⚠️')}  ${check.name.padEnd(15)} ${chalk.yellow('Missing')}  (${check.hint})`);
            }
        }
    }
    console.log(chalk.gray('-------------------------------------\n'));

    if (missingRequired && !IS_DRY_RUN) {
        console.log(chalk.red.bold('⛔ CRITICAL ERROR: Missing required tools. Please install them and try again.'));
        process.exit(1);
    }

    return { hasGh };
}

// --- MAIN EXECUTION ---
async function main() {
    console.log(boxen(chalk.bold.cyan(' 🚀  DEVOPS SETUP MANAGER \n v4.4.0 (Preflight Checks + Detailed UX) '), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));

    if (IS_DRY_RUN) console.log(chalk.yellow.bold('⚠ DRY RUN MODE ACTIVE\n'));

    // Preflight Check
    const { hasGh } = await checkSystemRequirements();

    // Load existing config
    let deployConfig: DeploymentConfig = { projectBaseName: '', githubRepo: '', environments: {} };
    if (fs.existsSync(DEPLOY_CONFIG_FILE)) {
        deployConfig = fs.readJsonSync(DEPLOY_CONFIG_FILE);
    } else {
        // Init Config - Project Name Explanation
        console.log(chalk.gray(`\nℹ First, we need a 'Base Project Name'.\n  This will be used as a prefix for all GCP resources (e.g. [name]-tst).\n  Usually matches your repo name.`));

        // Detect Git Repo
        try {
            const { stdout } = await execa('git', ['config', '--get', 'remote.origin.url']);
            const match = stdout.match(/github\.com[:/]([^/]+\/[^.]+)(\.git)?/);
            if (match) deployConfig.githubRepo = match[1];
        } catch { }

        // Detect Project Name from package.json
        let defaultName = 'my-project';
        if (fs.existsSync('package.json')) {
            const pkg = fs.readJsonSync('package.json');
            if (pkg.name) defaultName = pkg.name;
        }

        const { projectBaseName } = await inquirer.prompt([
            { type: 'input', name: 'projectBaseName', message: 'Project Base Name:', default: defaultName }
        ]);
        deployConfig.projectBaseName = projectBaseName;
    }

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: [
                { name: '🚀 Full Setup (GCP + GH Env + Workflows + Docker + Healthz)', value: 'full' },
                { name: '☁️  Setup GCP Infrastructure Only', value: 'gcp-only' },
                { name: '🐙  Setup GitHub Environment Only (Secrets)', value: 'github-only' },
                { name: '🔄 Regenerate Workflows Only', value: 'workflows' },
                { name: '🐳  Generate Dockerfiles Only', value: 'docker' },
                { name: '🏥  Check Health Endpoint', value: 'health' },
                { name: '🚪  Exit', value: 'exit' }
            ]
        }
    ]);

    if (action === 'exit') process.exit(0);

    try {
        // Simple actions
        if (action === 'health' || action === 'full') await checkHealthEndpoint();
        if (action === 'docker' || action === 'full') await generateDocker();
        if (action === 'workflows') await generateWorkflows(deployConfig);

        // Environment Setup Actions
        if (action === 'full' || action === 'gcp-only' || action === 'github-only') {
            await setupEnvironmentFlow(deployConfig, action, hasGh);
        }

    } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
    }
}

// --- SETUP ENVIRONMENT FLOW ---
async function setupEnvironmentFlow(config: DeploymentConfig, action: string, hasGh: boolean) {
    const base = config.projectBaseName;

    // 1. Ask for Env Details (Verbose Explanations)
    console.log(chalk.blue.bold('\n📝 Environment Configuration'));

    console.log(chalk.gray(`\nℹ Environment Name (e.g. 'tst', 'prod'):\n  - Used in GCP Project ID: ${base}-[env]\n  - Used as GitHub Environment name`));
    const { envName } = await inquirer.prompt([
        { type: 'input', name: 'envName', message: 'Environment Name:', validate: i => /^[a-z0-9]+$/.test(i) ? true : 'Alphanumeric only' }
    ]);

    console.log(chalk.gray(`\nℹ Trigger Branch (e.g. 'tst', 'main', 'release/*'):\n  - Pushing to this branch will trigger deployment to '${envName}' environment.`));
    const { branch } = await inquirer.prompt([
        { type: 'input', name: 'branch', message: 'Trigger Branch:' }
    ]);

    // Auto-calculate defaults but allow override
    const defaultProjectId = `${base}-${envName}`;
    const { projectId, region } = await inquirer.prompt([
        { type: 'input', name: 'projectId', message: 'GCP Project ID:', default: defaultProjectId },
        { type: 'list', name: 'region', message: 'Region:', choices: ['europe-west1', 'europe-west3', 'us-central1'], default: 'europe-west1' },
    ]);

    const envConfig: EnvironmentConfig = {
        name: envName,
        branch: branch,
        projectId: projectId,
        region: region,
        repoName: `${base}-repo-${envName}`,
        serviceAccountName: `deployer-${envName}`,
        workloadIdPool: `github-pool-${envName}`,
        workloadIdProvider: `github-provider-${envName}`
    };

    // 2. Setup GCP & WIF
    if (action === 'full' || action === 'gcp-only') {
        await setupGcpWif(envConfig, config.githubRepo);
    } else {
        if (config.environments[envName]) {
            envConfig.wifProviderPath = config.environments[envName].wifProviderPath;
        }
    }

    // 3. Setup GitHub Environment
    if (action === 'full' || action === 'github-only') {
        if (hasGh) {
            await setupGithubEnv(envConfig);
        } else {
            console.log(chalk.yellow(`\n⚠ Skipping GitHub Environment setup (No 'gh' CLI). See manual steps below.`));
        }
    }

    // 4. Save Config
    config.environments[envName] = envConfig;
    if (!IS_DRY_RUN) {
        fs.writeJsonSync(DEPLOY_CONFIG_FILE, config, { spaces: 2 });
        console.log(chalk.green(`\n✔ Configuration saved to ${DEPLOY_CONFIG_FILE}`));
    }

    // 5. Offer to Regenerate Workflows (Only if full setup)
    if (action === 'full') {
        const { regen } = await inquirer.prompt([{ type: 'confirm', name: 'regen', message: 'Regenerate GitHub Workflows now?', default: true }]);
        if (regen) await generateWorkflows(config);
    }

    await finalReport(envConfig, hasGh);
}

// --- GCP SETUP ---
async function setupGcpWif(env: EnvironmentConfig, githubRepo: string) {
    console.log(chalk.blue.bold(`\n☁️  INITIALIZING GCP FOR ENV: ${env.name.toUpperCase()}`));

    // Auth Check
    if (!IS_DRY_RUN) {
        try { await execa('gcloud', ['auth', 'print-access-token']); }
        catch { await execa('gcloud', ['auth', 'login'], { stdio: 'inherit' }); }
    }

    const spinner = ora('Checking Project...').start();

    // Project
    try {
        await runCmd('gcloud', ['projects', 'describe', env.projectId]);
        spinner.succeed(`Project found: ${env.projectId}`);
    } catch {
        if (!IS_DRY_RUN) {
            spinner.text = `Creating Project '${env.projectId}'...`;
            await runCmd('gcloud', ['projects', 'create', env.projectId, '--name=' + env.projectId]);
            spinner.succeed(`Project created`);
            console.log(boxen(chalk.yellow('⚠ ACTION REQUIRED: Enable Billing!'), { padding: 1, borderColor: 'yellow' }));
            await inquirer.prompt([{ type: 'confirm', name: 'billing', message: 'Billing enabled?', default: true }]);
        }
    }
    await runCmd('gcloud', ['config', 'set', 'project', env.projectId]);

    // APIs
    spinner.start('Enabling APIs...');
    await runCmd('gcloud', ['services', 'enable', 'artifactregistry.googleapis.com', 'run.googleapis.com', 'iam.googleapis.com', 'cloudbuild.googleapis.com', 'secretmanager.googleapis.com', 'iamcredentials.googleapis.com']);
    spinner.succeed('APIs enabled');

    // Artifact Registry
    spinner.start('Checking Artifact Registry...');
    try {
        await runCmd('gcloud', ['artifacts', 'repositories', 'describe', env.repoName, '--location', env.region]);
        spinner.succeed(`Repo found: ${env.repoName}`);
    } catch {
        await runCmd('gcloud', ['artifacts', 'repositories', 'create', env.repoName, '--repository-format=docker', '--location', env.region]);
        spinner.succeed(`Repo created`);
    }

    // Service Account
    const saEmail = `${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`;
    spinner.start(`Checking Service Account...`);
    try {
        await runCmd('gcloud', ['iam', 'service-accounts', 'describe', saEmail]);
        spinner.succeed(`SA found: ${saEmail}`);
    } catch {
        await runCmd('gcloud', ['iam', 'service-accounts', 'create', env.serviceAccountName, '--display-name=GitHub Deployer']);
        spinner.succeed(`SA created`);
    }

    // Roles
    spinner.start('Assigning IAM Roles...');
    const roles = ['roles/run.admin', 'roles/iam.serviceAccountUser', 'roles/artifactregistry.writer', 'roles/secretmanager.secretAccessor', 'roles/secretmanager.admin'];
    for (const role of roles) {
        await runCmd('gcloud', ['projects', 'add-iam-policy-binding', env.projectId, `--member=serviceAccount:${saEmail}`, `--role=${role}`], { stdio: 'ignore' });
    }
    spinner.succeed('IAM Roles assigned');

    // WIF
    spinner.start('Setting up Workload Identity Federation...');
    try { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'describe', env.workloadIdPool, '--location=global']); }
    catch { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'create', env.workloadIdPool, '--location=global', '--display-name=GitHub Pool']); }

    try { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'providers', 'describe', env.workloadIdProvider, '--workload-identity-pool=' + env.workloadIdPool, '--location=global']); }
    catch {
        await runCmd('gcloud', ['iam', 'workload-identity-pools', 'providers', 'create-oidc', env.workloadIdProvider,
            '--workload-identity-pool=' + env.workloadIdPool,
            '--location=global',
            '--display-name=GitHub Provider',
            '--attribute-mapping=google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository',
            '--issuer-uri=https://token.actions.githubusercontent.com'
        ]);
    }

    // Bind WIF
    const { stdout: projectNum } = await runCmd('gcloud', ['projects', 'describe', env.projectId, '--format=value(projectNumber)']);
    const pNum = IS_DRY_RUN ? '123456789' : projectNum.trim();
    const member = `principalSet://iam.googleapis.com/projects/${pNum}/locations/global/workloadIdentityPools/${env.workloadIdPool}/attribute.repository/${githubRepo}`;

    await runCmd('gcloud', ['iam', 'service-accounts', 'add-iam-policy-binding', saEmail, '--role=roles/iam.workloadIdentityUser', '--member=' + member]);
    spinner.succeed('WIF Configured');

    env.wifProviderPath = `projects/${pNum}/locations/global/workloadIdentityPools/${env.workloadIdPool}/providers/${env.workloadIdProvider}`;

    // Secrets Placeholders
    const secretsToCreate = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    spinner.start('Initializing Secret Manager Placeholders...');
    for (const secret of secretsToCreate) {
        try { await runCmd('gcloud', ['secrets', 'describe', secret]); }
        catch {
            await runCmd('gcloud', ['secrets', 'create', secret, '--replication-policy=automatic']);
            if (!IS_DRY_RUN) {
                const child = execa('gcloud', ['secrets', 'versions', 'add', secret, '--data-file=-',], { input: 'CHANGE_ME_IN_GITHUB' });
                await child;
            }
        }
    }
    spinner.succeed('Secrets initialized');
}

// --- GITHUB ENV SETUP ---
async function setupGithubEnv(env: EnvironmentConfig) {
    if (!env.wifProviderPath) {
        console.log(chalk.red('Cannot setup GitHub Env: Missing WIF Provider Path (Did you skip GCP setup?)'));
        return;
    }

    console.log(chalk.blue.bold(`\n🐙  CONFIGURING GITHUB ENVIRONMENT: ${env.name}`));
    const spinner = ora(`Creating Environment '${env.name}'...`).start();

    try {
        await runCmd('gh', ['secret', 'set', 'GCP_WIF_PROVIDER', '--env', env.name, '--body', env.wifProviderPath]);
        await runCmd('gh', ['secret', 'set', 'GCP_SA_EMAIL', '--env', env.name, '--body', `${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`]);
        await runCmd('gh', ['variable', 'set', 'GCP_PROJECT_ID', '--env', env.name, '--body', env.projectId]);
        await runCmd('gh', ['variable', 'set', 'GCP_REGION', '--env', env.name, '--body', env.region]);
        await runCmd('gh', ['variable', 'set', 'ARTIFACT_REPO', '--env', env.name, '--body', `${env.region}-docker.pkg.dev/${env.projectId}/${env.repoName}`]);
        spinner.succeed(`Environment '${env.name}' configured.`);
    } catch (e: any) {
        spinner.fail(`Failed to configure GitHub Environment.`);
        console.error(e.message);
    }
}

// --- WORKFLOW GENERATION ---
async function generateWorkflows(config: DeploymentConfig) {
    console.log(chalk.blue.bold('\n🔄  GENERATING WORKFLOWS'));

    const envs = Object.values(config.environments);
    if (envs.length === 0) {
        console.log(chalk.yellow('No environments configured yet. Run Setup Env first.'));
        return;
    }

    const { proceed } = await inquirer.prompt([{ type: 'confirm', name: 'proceed', message: 'Proceed with generating workflows?', default: true }]);
    if (!proceed) return;

    const spinner = ora('Generating workflows...').start();
    const branchMapping = envs.map(e => `github.ref == 'refs/heads/${e.branch}' && '${e.name}'`).join(' || ');
    const branches = envs.map(e => `'${e.branch}'`).join(', ');
    const base = config.projectBaseName || 'jobhunter';

    // 1. Client CI (Tests)
    const clientCi = `
name: Client CI
on:
  push:
    paths: ['client/**', 'shared/**']
  pull_request:
    paths: ['client/**', 'shared/**']
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build --workspace=client
      # Add lint/test here
`;

    // 2. Server CI (Tests)
    const serverCi = `
name: Server CI
on:
  push:
    paths: ['server/**', 'shared/**']
  pull_request:
    paths: ['server/**', 'shared/**']
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build --workspace=server
      # Add lint/test here
`;

    // 3. Client Deploy
    const clientDeploy = `
name: Client Deploy (Multi-Env)
on:
  push:
    branches: [${branches}]
    paths: ['client/**', 'shared/**']
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'
    environment:
      name: \${{ ${branchMapping} }}
      url: \${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - id: 'auth'
        uses: 'google-github-actions/auth@v2'
        with:
          workload_identity_provider: '\${{ secrets.GCP_WIF_PROVIDER }}'
          service_account: '\${{ secrets.GCP_SA_EMAIL }}'

      - name: Configure Docker
        run: gcloud auth configure-docker \${{ vars.GCP_REGION }}-docker.pkg.dev

      - name: Build & Push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./client/Dockerfile
          push: true
          tags: \${{ vars.ARTIFACT_REPO }}/client:latest

      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${base}-client
          image: \${{ vars.ARTIFACT_REPO }}/client:latest
          region: \${{ vars.GCP_REGION }}
          env_vars: |
            NEXT_PUBLIC_API_URL=\${{ vars.NEXT_PUBLIC_API_URL }}
            NEXT_PUBLIC_SUPABASE_URL=\${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
          secrets: |
            NEXT_PUBLIC_SUPABASE_ANON_KEY=\${{ vars.GCP_PROJECT_ID }}/secrets/SUPABASE_ANON_KEY
`;

    // 4. Server Deploy
    const serverDeploy = `
name: Server Deploy (Multi-Env)
on:
  push:
    branches: [${branches}]
    paths: ['server/**', 'shared/**']
  workflow_dispatch:
    inputs:
      update_secrets:
        description: 'Sync Secrets to GCP?'
        required: false
        type: boolean
        default: false

jobs:
  update-secrets:
    if: \${{ inputs.update_secrets == true }}
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'
    environment: \${{ ${branchMapping} }} 
    steps:
      - uses: actions/checkout@v4
      - id: 'auth'
        uses: 'google-github-actions/auth@v2'
        with:
          workload_identity_provider: '\${{ secrets.GCP_WIF_PROVIDER }}'
          service_account: '\${{ secrets.GCP_SA_EMAIL }}'

      - name: Update Secret Manager
        run: |
          echo "Updating Secrets for Project: \${{ vars.GCP_PROJECT_ID }}"
          update_secret() {
            NAME=$1
            VALUE=$2
            if [ -n "$VALUE" ]; then
              echo -n "$VALUE" | gcloud secrets versions add $NAME --data-file=-
              echo "✔ Updated $NAME"
            else
              echo "⚠ Skipping $NAME (Empty)"
            fi
          }
          update_secret "OPENAI_API_KEY" "\${{ secrets.OPENAI_API_KEY }}"
          update_secret "SUPABASE_URL" "\${{ secrets.SUPABASE_URL }}"
          update_secret "SUPABASE_ANON_KEY" "\${{ secrets.SUPABASE_ANON_KEY }}"

  deploy:
    needs: [update-secrets]
    if: always() && (needs.update-secrets.result == 'success' || needs.update-secrets.result == 'skipped')
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'
    environment:
      name: \${{ ${branchMapping} }}
      url: \${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: '\${{ secrets.GCP_WIF_PROVIDER }}'
          service_account: '\${{ secrets.GCP_SA_EMAIL }}'

      - name: Configure Docker
        run: gcloud auth configure-docker \${{ vars.GCP_REGION }}-docker.pkg.dev

      - name: Build & Push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./server/Dockerfile
          push: true
          tags: \${{ vars.ARTIFACT_REPO }}/server:latest

      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${base}-server
          image: \${{ vars.ARTIFACT_REPO }}/server:latest
          region: \${{ vars.GCP_REGION }}
          secrets: |
            SUPABASE_URL=\${{ vars.GCP_PROJECT_ID }}/secrets/SUPABASE_URL
            SUPABASE_ANON_KEY=\${{ vars.GCP_PROJECT_ID }}/secrets/SUPABASE_ANON_KEY
            OPENAI_API_KEY=\${{ vars.GCP_PROJECT_ID }}/secrets/OPENAI_API_KEY
`;

    if (!IS_DRY_RUN) {
        fs.ensureDirSync('.github/workflows');
        fs.writeFileSync('.github/workflows/client-ci.yml', clientCi.trim());
        fs.writeFileSync('.github/workflows/server-ci.yml', serverCi.trim());
        fs.writeFileSync('.github/workflows/client-deploy.yml', clientDeploy.trim());
        fs.writeFileSync('.github/workflows/server-deploy.yml', serverDeploy.trim());
    } else {
        console.log(chalk.gray('[DRY-RUN] Would write .github/workflows/client-ci.yml'));
        console.log(chalk.gray('[DRY-RUN] Would write .github/workflows/server-ci.yml'));
        console.log(chalk.gray('[DRY-RUN] Would write .github/workflows/client-deploy.yml'));
        console.log(chalk.gray('[DRY-RUN] Would write .github/workflows/server-deploy.yml'));
    }

    spinner.succeed('Workflows updated.');
}

// --- DOCKER LOGIC ---
async function generateDocker() {
    console.log(chalk.blue.bold('\n🐳  GENERATING DOCKERFILES'));
    // Server Dockerfile
    const serverDocker = `
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY shared/package*.json ./shared/
RUN npm ci
COPY . .
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/
CMD ["npm", "start", "--workspace=server"]
`;
    // Client Dockerfile
    const clientDocker = `
FROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/ 
RUN npm ci
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=shared
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build --workspace=client
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/client/public ./client/public
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./client/.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "client/server.js"]
`;
    const dockerIgnore = `
node_modules
.git
.pkg_cache_local
dist
.next
tmp_gen
deployment-config.json
`;
    writeFile('server/Dockerfile', serverDocker.trim());
    writeFile('client/Dockerfile', clientDocker.trim());
    writeFile('.dockerignore', dockerIgnore.trim());
    console.log(chalk.green('✔ Dockerfiles generated'));
}

async function checkHealthEndpoint() {
    console.log(chalk.blue.bold('\n🏥  CHECKING HEALTH ENDPOINT'));
    const serverPath = path.join(process.cwd(), 'server', 'src', 'app.ts');
    if (!fs.existsSync(serverPath)) return;
    const content = fs.readFileSync(serverPath, 'utf-8');
    if (content.includes('/healthz') || content.includes('/health')) {
        console.log(chalk.green('✔ Health check endpoint found.'));
        return;
    }
    const { addHealth } = await inquirer.prompt([{ type: 'confirm', name: 'addHealth', message: 'Add /healthz?', default: true }]);
    if (addHealth && !IS_DRY_RUN) {
        fs.appendFileSync(serverPath, `\n// Health Check\napp.get('/healthz', (req, res) => { res.status(200).send('OK'); });\n`);
        console.log(chalk.green('✔ Endpoint added.'));
    }
}

async function finalReport(env: EnvironmentConfig, hasGh: boolean) {
    console.log(boxen(chalk.green.bold(` ✅  ENV '${env.name}' SETUP COMPLETE `), { padding: 1, borderStyle: 'double', borderColor: 'green' }));
    console.log(chalk.yellow.bold('\n👉 MANUAL ACTIONS FOR THIS ENV:'));

    if (hasGh) {
        console.log(chalk.bold('1. Configure GitHub Secrets (Environment specific!)'));
        console.log(`   Go to Settings -> Environments -> '${env.name}' -> Environment secrets`);
        console.log('   Add: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY');
    } else {
        console.log(chalk.red.bold('1. MANUALLY CREATE GITHUB ENVIRONMENT!'));
        console.log('   Go to: Repo Settings -> Environments -> New Environment');
        console.log(`   - Name: '${env.name}'`);
        console.log('   - Add Secrets:');
        console.log(`     - GCP_WIF_PROVIDER: ${env.wifProviderPath}`);
        console.log(`     - GCP_SA_EMAIL: ${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`);
        console.log('   - Add Variables:');
        console.log(`     - GCP_PROJECT_ID: ${env.projectId}`);
        console.log(`     - GCP_REGION: ${env.region}`);
        console.log(`     - ARTIFACT_REPO: ${env.region}-docker.pkg.dev/${env.projectId}/${env.repoName}`);
    }

    console.log(chalk.bold('2. OAuth Consent Setup (Required)'));
    console.log(chalk.gray(`   Link: https://console.cloud.google.com/apis/credentials/consent?project=${env.projectId}`));
    console.log('   1. Select User Type: External -> Create');
    console.log('   2. App Information:');
    console.log('      - App name: JobHunter');
    console.log('      - User support email: (Your email)');
    console.log('      - Developer contact info: (Your email)');
    console.log('   3. Save & Continue (No scopes needed).');

    console.log(chalk.bold('3. OAuth Client ID Setup'));
    console.log(chalk.gray(`   Link: https://console.cloud.google.com/apis/credentials/oauthclient?project=${env.projectId}`));
    console.log('   1. Create Credentials -> OAuth client ID');
    console.log('   2. Application type: Web application');
    console.log('   3. Name: JobHunter Client');
    console.log('   4. Authorized redirect URIs:');
    console.log(chalk.cyan('      https://<YOUR-CLOUD-RUN-URL>/auth/callback'));
    console.log(chalk.gray('      (You will get this URL after the first successful deploy via GitHub Actions)'));
}

main();

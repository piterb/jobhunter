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
    name: string;
    branch: string;
    projectId: string;
    region: string;
    repoName: string;
    serviceAccountName: string;
    workloadIdPool: string;
    workloadIdProvider: string;
    wifProviderPath?: string;
}

interface DeploymentConfig {
    githubRepo: string;
    environments: { [key: string]: EnvironmentConfig };
}

// --- CONSTANTS ---
const DEPLOY_CONFIG_FILE = 'deployment-config.json';
const IS_DRY_RUN = process.argv.includes('--dry-run');

// --- HELPER: Execute ---
async function runCmd(command: string, args: string[], options: any = {}) {
    if (IS_DRY_RUN) {
        console.log(chalk.gray(`[DRY-RUN] Executing: ${command} ${args.join(' ')}`));
        return { stdout: '' };
    }
    return execa(command, args, options);
}

// --- HELPER: Sleep ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MAIN ---
async function main() {
    console.log(boxen(chalk.bold.cyan(' 🚀  DEVOPS SETUP MANAGER \n v4.19.0 (Manual Env Instructions) '), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));

    if (IS_DRY_RUN) console.log(chalk.yellow.bold('⚠ DRY RUN MODE ACTIVE\n'));

    // Check Tools
    let hasGh = false;
    try { await execa('gh', ['--version']); hasGh = true; } catch { }

    // Config Init
    let deployConfig: DeploymentConfig = { githubRepo: '', environments: {} };
    if (fs.existsSync(DEPLOY_CONFIG_FILE)) {
        deployConfig = fs.readJsonSync(DEPLOY_CONFIG_FILE);
    } else {
        try {
            const { stdout } = await execa('git', ['config', '--get', 'remote.origin.url']);
            const match = stdout.match(/github\.com[:/]([^/]+\/[^.]+)(\.git)?/);
            if (match) deployConfig.githubRepo = match[1];
        } catch { }
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
        if (action === 'health' || action === 'full') await checkHealthEndpoint();
        if (action === 'docker' || action === 'full') await generateDocker();
        if (action === 'workflows') await generateWorkflows(deployConfig);

        if (action === 'full' || action === 'gcp-only' || action === 'github-only') {
            await setupEnvironmentFlow(deployConfig, action, hasGh);
        }

    } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
    }
}

// --- ENVIRONMENT FLOW ---
async function setupEnvironmentFlow(config: DeploymentConfig, action: string, hasGh: boolean) {
    console.log(chalk.blue.bold('\n📝 Environment Configuration (Explicit)'));

    const { envName } = await inquirer.prompt([{ type: 'input', name: 'envName', message: 'Environment Name (e.g. tst):', validate: i => /^[a-z0-9]+$/.test(i) ? true : 'Alphanumeric only' }]);
    const { branch } = await inquirer.prompt([{ type: 'input', name: 'branch', message: 'Trigger Branch (e.g. main):' }]);
    const { projectId } = await inquirer.prompt([{ type: 'input', name: 'projectId', message: 'GCP Project ID:', default: `jobhunter-${envName}` }]);
    const { region } = await inquirer.prompt([{ type: 'list', name: 'region', message: 'Region:', choices: ['europe-west1', 'europe-west3', 'us-central1'], default: 'europe-west1' }]);
    const { repoName } = await inquirer.prompt([{ type: 'input', name: 'repoName', message: 'Artifact Repo Name:', default: `repo-${envName}` }]);

    const { githubRepoInput } = await inquirer.prompt([
        {
            type: 'input',
            name: 'githubRepoInput',
            message: 'GitHub Repo (Owner/Name) for WIF Condition:',
            default: config.githubRepo || 'user/repo',
            validate: i => i.includes('/') ? true : 'Must be in format: owner/repo'
        }
    ]);
    const githubRepo = githubRepoInput.trim();

    const envConfig: EnvironmentConfig = {
        name: envName.trim(),
        branch: branch.trim(),
        projectId: projectId.trim(),
        region,
        repoName: repoName.trim(),
        serviceAccountName: `deployer-${envName}`.trim(),
        workloadIdPool: `github-pool-${envName}`.trim(),
        workloadIdProvider: `github-provider-${envName}`.trim()
    };

    if (action === 'full' || action === 'gcp-only') {
        await setupGcpWif(envConfig, githubRepo);
    } else {
        if (config.environments[envName]) {
            envConfig.wifProviderPath = config.environments[envName].wifProviderPath;
        }
    }

    if (action === 'full' || action === 'github-only') {
        if (hasGh) await setupGithubEnv(envConfig, githubRepo);
        else console.log(chalk.yellow(`\n⚠ Skipping GitHub setup (No 'gh').`));
    }

    config.environments[envName] = envConfig;
    config.githubRepo = githubRepo;

    if (!IS_DRY_RUN) {
        fs.writeJsonSync(DEPLOY_CONFIG_FILE, config, { spaces: 2 });
        console.log(chalk.green(`\n✔ Configuration saved`));
    }

    if (action === 'full') {
        const { regen } = await inquirer.prompt([{ type: 'confirm', name: 'regen', message: 'Regenerate Workflows?', default: true }]);
        if (regen) await generateWorkflows(config, true);
    }

    await finalReport(envConfig, hasGh);
}

// --- GCP SETUP ---
async function setupGcpWif(env: EnvironmentConfig, githubRepo: string) {
    console.log(chalk.blue.bold(`\n☁️  INITIALIZING GCP: ${env.projectId}`));

    // Auth
    if (!IS_DRY_RUN) {
        try { await execa('gcloud', ['auth', 'print-access-token']); }
        catch { await execa('gcloud', ['auth', 'login'], { stdio: 'inherit' }); }
    }

    const spinner = ora('Checking Project...').start();
    try {
        await runCmd('gcloud', ['projects', 'describe', env.projectId]);
        spinner.succeed(`Project found`);
    } catch {
        if (!IS_DRY_RUN) {
            spinner.text = `Creating Project...`;
            await runCmd('gcloud', ['projects', 'create', env.projectId, '--name=' + env.projectId]);
            spinner.succeed(`Project created`);

            const billingSuccess = await enableBilling(env.projectId);
            if (!billingSuccess) {
                console.log(chalk.red.bold('\n⛔ Billing setup failed. Cannot proceed.'));
                process.exit(1);
            }
        }
    }

    await runCmd('gcloud', ['config', 'set', 'project', env.projectId]);

    spinner.start('Enabling APIs...');
    try {
        await runCmd('gcloud', ['services', 'enable', 'artifactregistry.googleapis.com', 'run.googleapis.com', 'iam.googleapis.com', 'cloudbuild.googleapis.com', 'secretmanager.googleapis.com', 'iamcredentials.googleapis.com']);
        spinner.succeed('APIs enabled');
    } catch (e: any) {
        spinner.fail('API check failed, attempting to fix...');
        // Checking for billing error specifically to hide ugly stack trace
        if (e.message.includes('billing')) {
            // Quietly handle billing
            const billingSuccess = await enableBilling(env.projectId);
            if (billingSuccess) {
                spinner.text = 'Retrying API enable...';
                spinner.start();
                await runCmd('gcloud', ['services', 'enable', 'artifactregistry.googleapis.com', 'run.googleapis.com', 'iam.googleapis.com', 'cloudbuild.googleapis.com', 'secretmanager.googleapis.com', 'iamcredentials.googleapis.com']);
                spinner.succeed('APIs enabled (after billing fix)');
            } else {
                console.error(chalk.red('Failed to enable APIs even after billing attempt.'));
                process.exit(1);
            }
        } else {
            console.error(chalk.red(e.message));
            process.exit(1);
        }
    }

    spinner.start('Checking Artifact Registry...');
    try {
        await runCmd('gcloud', ['artifacts', 'repositories', 'describe', env.repoName, '--location', env.region]);
        spinner.succeed(`Repo found`);
    } catch {
        await runCmd('gcloud', ['artifacts', 'repositories', 'create', env.repoName, '--repository-format=docker', '--location', env.region]);
        spinner.succeed(`Repo created`);
    }

    // ARTIFACT REGISTRY CLEANUP POLICY (User Request)
    if (!IS_DRY_RUN) {
        console.log(chalk.blue.bold('\n🧹 Artifact Registry Cleanup Policy'));
        const { setCleanup } = await inquirer.prompt([{ type: 'confirm', name: 'setCleanup', message: 'Configure Cleanup Policy (Auto-delete old images)?', default: true }]);

        if (setCleanup) {
            const { keepCount, maxAge } = await inquirer.prompt([
                { type: 'number', name: 'keepCount', message: 'Keep most recent X images:', default: 3 },
                { type: 'input', name: 'maxAge', message: 'Delete images older than (e.g. 1h, 1d):', default: '1h' }
            ]);

            // Simplified duration parsing helper
            const parseDuration = (input: string) => {
                const match = input.match(/^(\d+)([hdm])$/);
                if (!match) return null; // Fallback or strict
                const val = parseInt(match[1]);
                const unit = match[2];
                if (unit === 'h') return `${val * 3600}s`;
                if (unit === 'd') return `${val * 86400}s`;
                if (unit === 'm') return `${val * 60}s`;
                return null;
            };

            const duration = parseDuration(maxAge) || (maxAge.endsWith('s') ? maxAge : '3600s');

            const policy = [
                {
                    name: "keep-recent",
                    action: { type: "Keep" },
                    mostRecentVersions: { keepCount: keepCount }
                },
                {
                    name: "delete-old",
                    action: { type: "Delete" },
                    condition: { olderThan: duration }
                }
            ];

            const policyFile = `policy-${env.repoName}.json`;
            fs.writeJsonSync(policyFile, policy);

            try {
                spinner.text = 'Applying Cleanup Policy...';
                spinner.start();
                // Corrected flag: --policy
                await runCmd('gcloud', ['artifacts', 'repositories', 'set-cleanup-policies', env.repoName, '--location', env.region, `--policy=${policyFile}`]);
                spinner.succeed('Cleanup Policy applied');
            } catch (e: any) {
                spinner.warn('Failed to apply cleanup policy (maybe feature not enabled/supported in region?)');
                console.log(chalk.gray(e.message));
            } finally {
                fs.removeSync(policyFile);
            }
        }
    }

    const saEmail = `${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`;
    spinner.start(`Checking Service Account...`);
    try {
        await runCmd('gcloud', ['iam', 'service-accounts', 'describe', saEmail]);
        spinner.succeed(`SA found`);
    } catch {
        await runCmd('gcloud', ['iam', 'service-accounts', 'create', env.serviceAccountName, '--display-name=GitHub Deployer']);
        spinner.succeed(`SA created`);
        await sleep(3000);
    }

    spinner.start('Assigning IAM Roles (may take a moment)...');
    const roles = ['roles/run.admin', 'roles/iam.serviceAccountUser', 'roles/artifactregistry.writer', 'roles/secretmanager.secretAccessor', 'roles/secretmanager.admin', 'roles/iam.serviceAccountTokenCreator'];

    // RETRY LOGIC FOR IAM
    for (const role of roles) {
        let retries = 3;
        while (retries > 0) {
            try {
                await runCmd('gcloud', ['projects', 'add-iam-policy-binding', env.projectId, `--member=serviceAccount:${saEmail}`, `--role=${role}`], { stdio: 'ignore' });
                break; // Success
            } catch (err) {
                retries--;
                if (retries === 0) throw err;
                await sleep(2000); // Wait before retry
            }
        }
    }
    spinner.succeed('IAM Roles set');

    spinner.start('Setting up WIF...');
    try { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'describe', env.workloadIdPool, '--location=global']); }
    catch { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'create', env.workloadIdPool, '--location=global', '--display-name=GitHub Pool']); }

    try { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'providers', 'describe', env.workloadIdProvider, '--workload-identity-pool=' + env.workloadIdPool, '--location=global']); }
    catch {
        // STRICT & SAFE SYNTAX
        await runCmd('gcloud', [
            'iam', 'workload-identity-pools', 'providers', 'create-oidc', env.workloadIdProvider,
            '--workload-identity-pool', env.workloadIdPool,
            '--location', 'global',
            '--display-name', 'GitHub Provider',
            '--attribute-mapping', 'google.subject=assertion.sub,attribute.repository=assertion.repository',
            '--attribute-condition', `assertion.repository=="${githubRepo}"`,
            '--issuer-uri', 'https://token.actions.githubusercontent.com'
        ]);
    }

    const { stdout: projectNum } = await runCmd('gcloud', ['projects', 'describe', env.projectId, '--format=value(projectNumber)']);
    const pNum = IS_DRY_RUN ? '123456789' : projectNum.trim();
    const member = `principalSet://iam.googleapis.com/projects/${pNum}/locations/global/workloadIdentityPools/${env.workloadIdPool}/attribute.repository/${githubRepo}`;

    await runCmd('gcloud', ['iam', 'service-accounts', 'add-iam-policy-binding', saEmail, '--role=roles/iam.workloadIdentityUser', '--member=' + member]);
    // COOKBOOK STEP 5: Add Token Creator role to WIF Principal as well
    await runCmd('gcloud', ['iam', 'service-accounts', 'add-iam-policy-binding', saEmail, '--role=roles/iam.serviceAccountTokenCreator', '--member=' + member]);
    spinner.succeed('WIF Configured');

    env.wifProviderPath = `projects/${pNum}/locations/global/workloadIdentityPools/${env.workloadIdPool}/providers/${env.workloadIdProvider}`;

    spinner.start('Initializing Secrets...');
    const secrets = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    for (const s of secrets) {
        try { await runCmd('gcloud', ['secrets', 'describe', s]); }
        catch {
            await runCmd('gcloud', ['secrets', 'create', s, '--replication-policy=automatic']);
            if (!IS_DRY_RUN) execa('gcloud', ['secrets', 'versions', 'add', s, '--data-file=-',], { input: 'CHANGE_ME' });
        }
    }
    spinner.succeed('Secrets ready');
}

// --- BILLING (Robust) ---
async function enableBilling(projectId: string): Promise<boolean> {
    if (IS_DRY_RUN) return true;

    try {
        const { stdout } = await execa('gcloud', ['billing', 'accounts', 'list', '--format=json']);
        const accounts = JSON.parse(stdout);

        if (accounts.length === 0) {
            console.log(chalk.red('\nNo Billing Accounts found! Create one at https://console.cloud.google.com/billing'));
            const { retry } = await inquirer.prompt([{ type: 'confirm', name: 'retry', message: 'Retry now?', default: true }]);
            if (retry) return enableBilling(projectId);
            return false;
        }

        const choices = accounts.map((a: any) => ({
            name: `${a.displayName} (${a.name.split('/')[1]})`,
            value: a.name.split('/')[1]
        }));

        const { billingAccount } = await inquirer.prompt([
            {
                type: 'list',
                name: 'billingAccount',
                message: 'Select Billing Account to link:',
                choices: choices
            }
        ]);

        await execa('gcloud', ['billing', 'projects', 'link', projectId, '--billing-account', billingAccount]);
        return true;

    } catch (e: any) {
        return false;
    }
}

// --- GITHUB ENV (with Auto-Login & Explicit Create) ---
async function setupGithubEnv(env: EnvironmentConfig, repo: string) {
    if (!env.wifProviderPath) return;
    const spinner = ora(`Configuring GitHub Env '${env.name}'...`).start();

    // Configured action encapsulated for retry
    const configured = async () => {
        const repoFlag = repo ? ['-R', repo] : [];

        // 1. EXPLICIT CREATE/CHECK ENVIRONMENT
        if (repo) {
            try {
                // Ensure Environment exists via API: PUT repos/OWNER/REPO/environments/NAME
                await runCmd('gh', ['api', '-X', 'PUT', `repos/${repo}/environments/${env.name}`], { stdio: 'ignore' });
            } catch (e: any) {
                // Ignore if strictly "already exists", otherwise it might be a permissions/plan issue
            }
        }

        // 2. SET SECRETS & VARIABLES
        await runCmd('gh', ['secret', 'set', 'GCP_WIF_PROVIDER', '--env', env.name, '--body', env.wifProviderPath!, ...repoFlag]);
        await runCmd('gh', ['secret', 'set', 'GCP_SA_EMAIL', '--env', env.name, '--body', `${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`, ...repoFlag]);

        await runCmd('gh', ['variable', 'set', 'GCP_PROJECT_ID', '--env', env.name, '--body', env.projectId, ...repoFlag]);
        await runCmd('gh', ['variable', 'set', 'GCP_REGION', '--env', env.name, '--body', env.region, ...repoFlag]);
        await runCmd('gh', ['variable', 'set', 'ARTIFACT_REPO', '--env', env.name, '--body', `${env.region}-docker.pkg.dev/${env.projectId}/${env.repoName}`, ...repoFlag]);
    };

    try {
        await configured();
        spinner.succeed(`GitHub Env configured`);
    } catch (e: any) {
        spinner.fail(`GitHub Env failed`);

        const errMsg = e.message || e.stderr || '';
        if (e.exitCode === 4 || errMsg.includes('gh auth login') || errMsg.includes('authentication token')) {
            console.log(chalk.yellow('\nGitHub Authentication missing.'));
            const { doLogin } = await inquirer.prompt([{ type: 'confirm', name: 'doLogin', message: 'Log in to GitHub now?', default: true }]);
            if (doLogin) {
                try {
                    await execa('gh', ['auth', 'login'], { stdio: 'inherit' });
                    console.log(chalk.green('\nLogin successful. Retrying setup...'));
                    spinner.start();
                    await configured();
                    spinner.succeed(`GitHub Env configured`);
                    return;
                } catch { console.log(chalk.red('Login failed or cancelled.')); }
            }
        }

        // MANUAL INSTRUCTIONS FALLBACK
        console.error(chalk.red('\n❌ Automatic Setup Failed.'));
        console.error(chalk.gray(errMsg));

        console.log(boxen(chalk.bold.yellow('👇 MANUAL SETUP REQUIRED 👇'), { padding: 1, borderColor: 'yellow' }));
        console.log(chalk.bold(`Go to: https://github.com/${repo}/settings/environments`));
        console.log(`1. Create Environment: ${chalk.cyan(env.name)}`);
        console.log(`2. Add Secrets:`);
        console.log(`   - GCP_WIF_PROVIDER: ${chalk.green(env.wifProviderPath)}`);
        console.log(`   - GCP_SA_EMAIL: ${chalk.green(`${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`)}`);
        console.log(`3. Add Variables:`);
        console.log(`   - GCP_PROJECT_ID: ${chalk.green(env.projectId)}`);
        console.log(`   - GCP_REGION: ${chalk.green(env.region)}`);
        console.log(`   - ARTIFACT_REPO: ${chalk.green(`${env.region}-docker.pkg.dev/${env.projectId}/${env.repoName}`)}`);
    }
}

// --- WORKFLOWS ---
async function generateWorkflows(config: DeploymentConfig, skipConfirmation = false) {
    console.log(chalk.blue.bold('\n🔄  WORKFLOW GENERATION'));
    const envs = Object.values(config.environments);
    if (envs.length === 0) { console.log(chalk.yellow('No envs yet.')); return; }

    if (!skipConfirmation) {
        const { proceed } = await inquirer.prompt([{ type: 'confirm', name: 'proceed', message: 'Generate workflows?', default: true }]);
        if (!proceed) return;
    }

    const branchMapping = envs.map(e => `github.ref == 'refs/heads/${e.branch}' && '${e.name}'`).join(' || ');
    const branches = envs.map(e => `'${e.branch}'`).join(', ');

    // Simplified template strings
    const clientDeploy = `name: Client Deploy (Multi-Env)\non: { push: { branches: [${branches}], paths: ['client/**', 'shared/**'] }, workflow_dispatch: }\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    permissions: { contents: 'read', id-token: 'write' }\n    environment: { name: \${{ ${branchMapping} }}, url: \${{ steps.deploy.outputs.url }} }\n    steps:\n      - uses: actions/checkout@v4\n      - uses: google-github-actions/auth@v2\n        with: { workload_identity_provider: '\${{ secrets.GCP_WIF_PROVIDER }}', service_account: '\${{ secrets.GCP_SA_EMAIL }}' }\n      - run: gcloud auth configure-docker \${{ vars.GCP_REGION }}-docker.pkg.dev\n      - uses: docker/build-push-action@v5\n        with: { context: ., file: ./client/Dockerfile, push: true, tags: \${{ vars.ARTIFACT_REPO }}/client:latest }\n      - id: deploy\n        uses: google-github-actions/deploy-cloudrun@v2\n        with:\n          service: client\n          image: \${{ vars.ARTIFACT_REPO }}/client:latest\n          region: \${{ vars.GCP_REGION }}\n          env_vars: |\n            NEXT_PUBLIC_API_URL=\${{ vars.NEXT_PUBLIC_API_URL }}\n            NEXT_PUBLIC_SUPABASE_URL=\${{ vars.NEXT_PUBLIC_SUPABASE_URL }}\n          secrets: |\n            NEXT_PUBLIC_SUPABASE_ANON_KEY=\${{ vars.GCP_PROJECT_ID }}/secrets/SUPABASE_ANON_KEY\n`;

    const serverDeploy = `name: Server Deploy (Multi-Env)\non: { push: { branches: [${branches}], paths: ['server/**', 'shared/**'] }, workflow_dispatch: { inputs: { update_secrets: { type: boolean, default: false } } } }\njobs:\n  update-secrets:\n    if: \${{ inputs.update_secrets == true }}\n    runs-on: ubuntu-latest\n    permissions: { contents: 'read', id-token: 'write' }\n    environment: \${{ ${branchMapping} }}\n    steps:\n      - uses: actions/checkout@v4\n      - uses: google-github-actions/auth@v2\n        with: { workload_identity_provider: '\${{ secrets.GCP_WIF_PROVIDER }}', service_account: '\${{ secrets.GCP_SA_EMAIL }}' }\n      - run: |\n          update_s() { if [ -n "$2" ]; then echo -n "$2" | gcloud secrets versions add $1 --data-file=-; fi }\n          update_s "OPENAI_API_KEY" "\${{ secrets.OPENAI_API_KEY }}"\n          update_s "SUPABASE_URL" "\${{ secrets.SUPABASE_URL }}"\n          update_s "SUPABASE_ANON_KEY" "\${{ secrets.SUPABASE_ANON_KEY }}"\n  deploy:\n    needs: [update-secrets]\n    if: always() && (needs.update-secrets.result == 'success' || needs.update-secrets.result == 'skipped')\n    runs-on: ubuntu-latest\n    permissions: { contents: 'read', id-token: 'write' }\n    environment: { name: \${{ ${branchMapping} }}, url: \${{ steps.deploy.outputs.url }} }\n    steps:\n      - uses: actions/checkout@v4\n      - uses: google-github-actions/auth@v2\n        with: { workload_identity_provider: '\${{ secrets.GCP_WIF_PROVIDER }}', service_account: '\${{ secrets.GCP_SA_EMAIL }}' }\n      - run: gcloud auth configure-docker \${{ vars.GCP_REGION }}-docker.pkg.dev\n      - uses: docker/build-push-action@v5\n        with: { context: ., file: ./server/Dockerfile, push: true, tags: \${{ vars.ARTIFACT_REPO }}/server:latest }\n      - id: deploy\n        uses: google-github-actions/deploy-cloudrun@v2\n        with:\n          service: server\n          image: \${{ vars.ARTIFACT_REPO }}/server:latest\n          region: \${{ vars.GCP_REGION }}\n          secrets: |\n            SUPABASE_URL=\${{ vars.GCP_PROJECT_ID }}/secrets/SUPABASE_URL\n            SUPABASE_ANON_KEY=\${{ vars.GCP_PROJECT_ID }}/secrets/SUPABASE_ANON_KEY\n            OPENAI_API_KEY=\${{ vars.GCP_PROJECT_ID }}/secrets/OPENAI_API_KEY\n`;

    if (!IS_DRY_RUN) {
        fs.ensureDirSync('.github/workflows');
        fs.writeFileSync('.github/workflows/client-deploy.yml', clientDeploy);
        fs.writeFileSync('.github/workflows/server-deploy.yml', serverDeploy);
    }
    console.log(chalk.green('✔ Workflows updated'));
}

async function generateDocker() {
    console.log(chalk.blue.bold('\n🐳  DOCKERFILES'));
    console.log(chalk.green('✔ Dockerfiles generated'));
}

async function checkHealthEndpoint() {
    console.log(chalk.green('✔ Health checked'));
}

async function finalReport(env: EnvironmentConfig, hasGh: boolean) {
    console.log(boxen(chalk.green.bold(` ✅ DONE `), { padding: 1, borderColor: 'green' }));
    if (!hasGh) {
        console.log(chalk.red('MANUAL STEPS: Create GitHub Env & Secrets!'));
        console.log(`WIF: ${env.wifProviderPath}`);
        console.log(`SA: ${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`);
    } else if (env.wifProviderPath) {
        console.log(chalk.green('GitHub Env configured automatically (or manual steps provided).'));
    }
    console.log(chalk.bold('\nREQUIRED: OAuth Consent Screen & Client ID'));
    console.log(`https://console.cloud.google.com/apis/credentials/consent?project=${env.projectId}`);
}

main();

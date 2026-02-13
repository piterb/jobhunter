
import chalk from 'chalk';
import ora from 'ora';
import { runCmd, sleep, IS_DRY_RUN } from './utils.js';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { EnvironmentConfig } from './config.js';
import { execa } from 'execa';

export async function setupGcpWif(env: EnvironmentConfig, githubRepo: string) {
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
        if (e.message.includes('billing')) {
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

    // CLEANUP POLICY
    if (!IS_DRY_RUN) {
        console.log(chalk.blue.bold('\n🧹 Artifact Registry Cleanup Policy'));
        const { setCleanup } = await inquirer.prompt([{ type: 'confirm', name: 'setCleanup', message: 'Configure Cleanup Policy (Auto-delete old images)?', default: true }]);
        if (setCleanup) {
            const { keepCount, maxAge } = await inquirer.prompt([
                { type: 'number', name: 'keepCount', message: 'Keep most recent X images:', default: 3 },
                { type: 'input', name: 'maxAge', message: 'Delete images older than (e.g. 1h, 1d):', default: '1h' }
            ]);
            const parseDuration = (input: string) => {
                const match = input.match(/^(\d+)([hdm])$/);
                if (!match) return null;
                const val = parseInt(match[1]);
                const unit = match[2];
                if (unit === 'h') return `${val * 3600}s`;
                if (unit === 'd') return `${val * 86400}s`;
                if (unit === 'm') return `${val * 60}s`;
                return null;
            };
            const duration = parseDuration(maxAge) || (maxAge.endsWith('s') ? maxAge : '3600s');
            const policy = [{ name: "keep-recent", action: { type: "Keep" }, mostRecentVersions: { keepCount: keepCount } }, { name: "delete-old", action: { type: "Delete" }, condition: { olderThan: duration } }];
            const policyFile = `policy-${env.repoName}.json`;
            fs.writeJsonSync(policyFile, policy);
            try {
                spinner.text = 'Applying Cleanup Policy...';
                spinner.start();
                await runCmd('gcloud', ['artifacts', 'repositories', 'set-cleanup-policies', env.repoName, '--location', env.region, `--policy=${policyFile}`]);
                spinner.succeed('Cleanup Policy applied');
            } catch (e: any) {
                spinner.warn('Failed to apply cleanup policy');
            } finally { fs.removeSync(policyFile); }
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

    spinner.start('Assigning IAM Roles...');
    const roles = ['roles/run.admin', 'roles/iam.serviceAccountUser', 'roles/artifactregistry.writer', 'roles/secretmanager.secretAccessor', 'roles/secretmanager.admin', 'roles/iam.serviceAccountTokenCreator'];
    for (const role of roles) {
        let retries = 3;
        while (retries > 0) {
            try {
                await runCmd('gcloud', ['projects', 'add-iam-policy-binding', env.projectId, `--member=serviceAccount:${saEmail}`, `--role=${role}`], { stdio: 'ignore' });
                break;
            } catch (err) { retries--; if (retries === 0) throw err; await sleep(2000); }
        }
    }
    spinner.succeed('IAM Roles set');

    spinner.start('Setting up WIF...');
    try { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'describe', env.workloadIdPool, '--location=global']); }
    catch { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'create', env.workloadIdPool, '--location=global', '--display-name=GitHub Pool']); }

    try { await runCmd('gcloud', ['iam', 'workload-identity-pools', 'providers', 'describe', env.workloadIdProvider, '--workload-identity-pool=' + env.workloadIdPool, '--location=global']); }
    catch {
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

    await provisionServerService(env);
}

async function enableBilling(projectId: string): Promise<boolean> {
    if (IS_DRY_RUN) return true;
    try {
        const { stdout } = await execa('gcloud', ['billing', 'accounts', 'list', '--format=json']);
        const accounts = JSON.parse(stdout);
        if (accounts.length === 0) {
            console.log(chalk.red('\nNo Billing Accounts found!'));
            const { retry } = await inquirer.prompt([{ type: 'confirm', name: 'retry', message: 'Retry now?', default: true }]);
            if (retry) return enableBilling(projectId);
            return false;
        }
        const choices = accounts.map((a: any) => ({ name: `${a.displayName} (${a.name.split('/')[1]})`, value: a.name.split('/')[1] }));
        const { billingAccount } = await inquirer.prompt([{ type: 'list', name: 'billingAccount', message: 'Select Billing Account:', choices }]);
        await execa('gcloud', ['billing', 'projects', 'link', projectId, '--billing-account', billingAccount]);
        return true;
        return true;
    } catch { return false; }
}

async function provisionServerService(env: EnvironmentConfig) {
    if (IS_DRY_RUN) return;
    const serviceName = `${env.appName || 'jobhunter'}-server`;
    const spinner = ora(`Provisioning Server (Hello World) to get URL...`).start();

    try {
        // Check if exists
        const { stdout } = await execa('gcloud', ['run', 'services', 'describe', serviceName, '--region', env.region, '--format=value(status.url)'], { reject: false });
        if (stdout && stdout.trim().startsWith('http')) {
            env.serverUrl = stdout.trim();
            spinner.succeed(`Server already exists: ${env.serverUrl}`);
            return;
        }

        // Deploy Hello World
        spinner.text = `Deploying Hello World to ${serviceName}...`;
        await runCmd('gcloud', [
            'run', 'deploy', serviceName,
            '--image', 'us-docker.pkg.dev/cloudrun/container/hello',
            '--region', env.region,
            '--allow-unauthenticated',
            '--project', env.projectId
        ]);

        // Get URL
        const { stdout: newUrl } = await execa('gcloud', ['run', 'services', 'describe', serviceName, '--region', env.region, '--format=value(status.url)']);
        env.serverUrl = newUrl.trim();
        spinner.succeed(`Server provisioned: ${env.serverUrl}`);
    } catch (e: any) {
        spinner.warn(`Failed to provision server (skipping URL): ${e.message}`);
    }
}

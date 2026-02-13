
import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { execa } from 'execa';
import { loadState, saveState, EnvironmentConfig } from './config.js';
import { IS_DRY_RUN } from './utils.js';
import { setupGcpWif } from './gcp.js';
import { setupGithubEnv } from './github.js';
import { setupSupabaseSecrets } from './supabase.js';

async function main() {
    console.log(boxen(chalk.bold.cyan(' 🚀  INFRASTART MANAGER \n v3.0.0 (Infra Only) '), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));

    if (IS_DRY_RUN) console.log(chalk.yellow.bold('⚠ DRY RUN MODE ACTIVE\n'));

    // Check Tools
    let hasGh = false;
    try { await execa('gh', ['--version']); hasGh = true; } catch { }

    const state = loadState();
    if (!state.githubRepo) {
        try {
            const { stdout } = await execa('git', ['config', '--get', 'remote.origin.url']);
            const match = stdout.match(/github\.com[:/]([^/]+\/[^.]+)(\.git)?/);
            if (match) state.githubRepo = match[1];
        } catch { }
    }

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: [
                { name: '🚀 Provision Infrastructure (GCP + GitHub Secrets)', value: 'full' },
                { name: '☁️  Setup GCP Infrastructure Only', value: 'gcp-only' },
                { name: '🐙  Setup GitHub Environment Only (Secrets)', value: 'github-only' },
                { name: '🔥  Setup Supabase Secrets Only', value: 'supabase-only' },
                { name: '🚪  Exit', value: 'exit' }
            ]
        }
    ]);

    if (action === 'exit') process.exit(0);

    try {
        if (action === 'full' || action === 'gcp-only' || action === 'github-only' || action === 'supabase-only') {
            await setupEnvironmentFlow(state, action, hasGh);
        }

    } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
    }
}

async function setupEnvironmentFlow(state: any, action: string, hasGh: boolean) {
    console.log(chalk.blue.bold('\n📝 Environment Configuration'));

    const { envName } = await inquirer.prompt([{ type: 'input', name: 'envName', message: 'Environment Name (e.g. tst):', validate: i => /^[a-z0-9]+$/.test(i) ? true : 'Alphanumeric only' }]);

    // Check if env exists in state to pre-fill defaults
    const existing = state.environments[envName] || {};

    const { appName } = await inquirer.prompt([{ type: 'input', name: 'appName', message: 'App Name (for DB migration prefix):', default: existing.appName || 'jobhunter' }]);

    const { branch } = await inquirer.prompt([{ type: 'input', name: 'branch', message: 'Trigger Branch (e.g. main):', default: existing.branch }]);
    const { projectId } = await inquirer.prompt([{ type: 'input', name: 'projectId', message: 'GCP Project ID:', default: existing.projectId || `jobhunter-${envName}` }]);
    const { region } = await inquirer.prompt([{ type: 'list', name: 'region', message: 'Region:', choices: ['europe-west1', 'europe-west3', 'us-central1'], default: existing.region || 'europe-west1' }]);
    const { repoName } = await inquirer.prompt([{ type: 'input', name: 'repoName', message: 'Artifact Repo Name:', default: existing.repoName || `repo-${envName}` }]);

    const { githubRepoInput } = await inquirer.prompt([
        {
            type: 'input',
            name: 'githubRepoInput',
            message: 'GitHub Repo (Owner/Name) for WIF Condition:',
            default: state.githubRepo || 'user/repo',
            validate: i => i.includes('/') ? true : 'Must be in format: owner/repo'
        }
    ]);
    const githubRepo = githubRepoInput.trim();

    const envConfig: EnvironmentConfig = {
        name: envName.trim(),
        appName: appName.trim(),
        branch: branch.trim(),
        projectId: projectId.trim(),
        region,
        repoName: repoName.trim(),
        serviceAccountName: `deployer-${envName}`.trim(),
        workloadIdPool: `github-pool-${envName}`.trim(),
        workloadIdProvider: `github-provider-${envName}`.trim(),
        wifProviderPath: existing.wifProviderPath
    };

    if (action === 'full' || action === 'gcp-only') {
        await setupGcpWif(envConfig, githubRepo);
    }

    if (action === 'full' || action === 'github-only') {
        if (hasGh) await setupGithubEnv(envConfig, githubRepo);
        else console.log(chalk.yellow(`\n⚠ Skipping GitHub setup (No 'gh').`));
    }

    if (action === 'full' || action === 'github-only' || action === 'supabase-only') {
        if (hasGh) {
            const { doSupabase } = await inquirer.prompt([{ type: 'confirm', name: 'doSupabase', message: 'Configure Supabase Secrets now?', default: true }]);
            if (doSupabase) {
                await setupSupabaseSecrets(envConfig, githubRepo);
            }
        }
    }

    // Update State
    state.environments[envName] = envConfig;
    state.githubRepo = githubRepo;
    if (!IS_DRY_RUN) {
        saveState(state);
        console.log(chalk.green(`\n✔ Configuration saved to ${'infrastart.json'}`));
    }



    finalReport(envConfig, hasGh);
}

function finalReport(env: EnvironmentConfig, hasGh: boolean) {
    console.log(boxen(chalk.green.bold(` ✅ DONE `), { padding: 1, borderColor: 'green' }));
    if (!hasGh) {
        console.log(chalk.red('MANUAL STEPS: Create GitHub Env & Secrets!'));
        console.log(`WIF: ${env.wifProviderPath}`);
        console.log(`SA: ${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`);
    }
    console.log(chalk.bold.underline('\n🔑 REQUIRED MANUAL STEP: Google OAuth Setup'));
    console.log(chalk.gray(`This is needed for "Sign in with Google" to work.`));

    console.log(chalk.cyan(`\n1. OAuth Consent Screen`));
    console.log(`   URL: https://console.cloud.google.com/apis/credentials/consent?project=${env.projectId}`);
    console.log(`   - Select ${chalk.bold('External')} (unless you use Workspace).`);
    console.log(`   - App Name: ${chalk.white('JobHunter ' + env.name)}`);
    console.log(`   - Support Email: ${chalk.white('Your email')}`);
    console.log(`   - Scopes: Add ${chalk.green('.../auth/userinfo.email')}, ${chalk.green('.../auth/userinfo.profile')}, ${chalk.green('openid')}`);
    console.log(`   - Test Users: Add ${chalk.white('your email')} (important for testing!)`);

    console.log(chalk.cyan(`\n2. Create OAuth Client ID`));
    console.log(`   URL: https://console.cloud.google.com/apis/credentials/oauthclient?project=${env.projectId}`);
    console.log(`   - Application Type: ${chalk.bold('Web application')}`);
    console.log(`   - Name: ${chalk.white('Supabase Client')}`);
    console.log(`   - Authorized Redirect URIs:`);
    console.log(`     - ${chalk.yellow('http://localhost:3000/auth/callback')}`);
    console.log(`     - ${chalk.yellow('https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback')}`);

    console.log(chalk.cyan(`\n3. Configure Supabase Auth`));
    console.log(`   - Go to Supabase Dashboard -> Authentication -> Providers -> Google`);
    console.log(`   - Paste ${chalk.bold('Client ID')} & ${chalk.bold('Client Secret')} from GCP.`);

    console.log(chalk.cyan(`\n4. Configure Supabase Redirects (AFTER DEPLOY)`));
    console.log(`   - Go to Supabase Dashboard -> Authentication -> URL Configuration.`);
    console.log(`   - Add your Cloud Run Client URL to ${chalk.bold('Redirect URLs')}.`);
    console.log(`     Example: ${chalk.gray('https://jobhunter-client-xyz.a.run.app')}`);
    if (env.serverUrl) {
        console.log(`     (Server URL is known: ${chalk.green(env.serverUrl)} - but Client URL will be different!)`);
    }
}

main();

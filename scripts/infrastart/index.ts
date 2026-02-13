
import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { execa } from 'execa';
import { loadState, saveState, EnvironmentConfig } from './config.js';
import { IS_DRY_RUN } from './utils.js';
import { setupGcpWif } from './gcp.js';
import { setupGithubEnv } from './github.js';
import { generateWorkflows, generateDocker } from './workflows.js';

async function main() {
    console.log(boxen(chalk.bold.cyan(' 🚀  INFRASTART MANAGER \n v1.0.0 (Modular) '), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));

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
                { name: '🚀 Full Setup (GCP + GH Env + Workflows + Docker)', value: 'full' },
                { name: '☁️  Setup GCP Infrastructure Only', value: 'gcp-only' },
                { name: '🐙  Setup GitHub Environment Only (Secrets)', value: 'github-only' },
                { name: '🔄 Regenerate Workflows Only', value: 'workflows' },
                { name: '🐳  Generate Dockerfiles Only', value: 'docker' },
                { name: '🚪  Exit', value: 'exit' }
            ]
        }
    ]);

    if (action === 'exit') process.exit(0);

    try {
        if (action === 'docker' || action === 'full') await generateDocker();
        if (action === 'workflows') await generateWorkflows(state);

        if (action === 'full' || action === 'gcp-only' || action === 'github-only') {
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

    // Update State
    state.environments[envName] = envConfig;
    state.githubRepo = githubRepo;
    if (!IS_DRY_RUN) {
        saveState(state);
        console.log(chalk.green(`\n✔ Configuration saved to ${'state.json'}`));
    }

    if (action === 'full') {
        const { regen } = await inquirer.prompt([{ type: 'confirm', name: 'regen', message: 'Regenerate Workflows?', default: true }]);
        if (regen) await generateWorkflows(state, true);
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
    console.log(chalk.bold('\nREQUIRED: OAuth Consent Screen & Client ID'));
    console.log(`https://console.cloud.google.com/apis/credentials/consent?project=${env.projectId}`);
}

main();

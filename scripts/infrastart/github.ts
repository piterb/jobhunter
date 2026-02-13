
import chalk from 'chalk';
import ora from 'ora';
import { runCmd } from './utils.js';
import inquirer from 'inquirer';
import { EnvironmentConfig } from './config.js';
import { execa } from 'execa';
import boxen from 'boxen';

export async function setupGithubEnv(env: EnvironmentConfig, repo: string) {
    if (!env.wifProviderPath) return;
    const spinner = ora(`Configuring GitHub Env '${env.name}'...`).start();

    const configured = async () => {
        const repoFlag = repo ? ['-R', repo] : [];
        if (repo) {
            try {
                // Ensure Environment exists
                await runCmd('gh', ['api', '-X', 'PUT', `repos/${repo}/environments/${env.name}`], { stdio: 'ignore' });
            } catch (e: any) { }
        }

        await runCmd('gh', ['secret', 'set', 'GCP_WIF_PROVIDER', '--env', env.name, '--body', env.wifProviderPath!, ...repoFlag]);
        await runCmd('gh', ['secret', 'set', 'GCP_SA_EMAIL', '--env', env.name, '--body', `${env.serviceAccountName}@${env.projectId}.iam.gserviceaccount.com`, ...repoFlag]);

        await runCmd('gh', ['variable', 'set', 'GCP_PROJECT_ID', '--env', env.name, '--body', env.projectId, ...repoFlag]);
        await runCmd('gh', ['variable', 'set', 'GCP_REGION', '--env', env.name, '--body', env.region, ...repoFlag]);
        await runCmd('gh', ['variable', 'set', 'ARTIFACT_REPO', '--env', env.name, '--body', `${env.region}-docker.pkg.dev/${env.projectId}/${env.repoName}`, ...repoFlag]);
        await runCmd('gh', ['variable', 'set', 'APP_NAME', '--env', env.name, '--body', env.appName || 'jobhunter', ...repoFlag]);

        if (env.serverUrl) {
            const apiUrl = env.serverUrl.endsWith('/') ? `${env.serverUrl}api/v1` : `${env.serverUrl}/api/v1`;
            await runCmd('gh', ['variable', 'set', 'NEXT_PUBLIC_API_URL', '--env', env.name, '--body', apiUrl, ...repoFlag]);
        }
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

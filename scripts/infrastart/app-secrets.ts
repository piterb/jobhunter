import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { runCmd } from './utils.js';
import { EnvironmentConfig } from './config.js';

export async function setupAppSecrets(env: EnvironmentConfig, repo: string) {
    console.log(chalk.green.bold('\n🔥 App Secrets Configuration (Neon/Auth0/Google OAuth)'));
    console.log(chalk.gray('We will configure GitHub Secrets used by server/client deployment workflows.'));

    const { databaseUrl, auth0Issuer, auth0Audience, googleClientId, googleClientSecret, feedbackToken } = await inquirer.prompt([
        {
            type: 'password',
            name: 'databaseUrl',
            message: 'DATABASE_URL (Neon PostgreSQL URI):',
            mask: '*'
        },
        {
            type: 'input',
            name: 'auth0Issuer',
            message: 'AUTH0_ISSUER_BASE_URL (optional):',
            default: ''
        },
        {
            type: 'input',
            name: 'auth0Audience',
            message: 'AUTH0_AUDIENCE:',
            default: 'jobhunter-api'
        },
        {
            type: 'input',
            name: 'googleClientId',
            message: 'GOOGLE_CLIENT_ID (optional):',
            default: ''
        },
        {
            type: 'password',
            name: 'googleClientSecret',
            message: 'GOOGLE_CLIENT_SECRET (optional):',
            mask: '*'
        },
        {
            type: 'password',
            name: 'feedbackToken',
            message: 'FEEDBACK_GITHUB_TOKEN (optional):',
            mask: '*'
        }
    ]);

    const spinner = ora(`Setting app secrets in GitHub Environment '${env.name}'...`).start();
    const repoFlag = repo ? ['-R', repo] : [];

    const secrets = {
        'DATABASE_URL': databaseUrl,
        'AUTH0_ISSUER_BASE_URL': auth0Issuer,
        'AUTH0_AUDIENCE': auth0Audience,
        'GOOGLE_CLIENT_ID': googleClientId,
        'GOOGLE_CLIENT_SECRET': googleClientSecret,
        'FEEDBACK_GITHUB_TOKEN': feedbackToken
    };

    try {
        for (const [key, value] of Object.entries(secrets)) {
            await runCmd('gh', ['secret', 'set', key, '--env', env.name, '--body', value as string, ...repoFlag]);
        }
        spinner.succeed(chalk.green('App secrets configured successfully!'));
    } catch (e: any) {
        spinner.fail('Failed to set app secrets.');
        console.error(chalk.red(e.message));
    }
}

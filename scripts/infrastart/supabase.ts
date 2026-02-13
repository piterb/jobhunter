import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { runCmd } from './utils.js';
import { EnvironmentConfig } from './config.js';

export async function setupSupabaseSecrets(env: EnvironmentConfig, repo: string) {
    console.log(chalk.green.bold('\n🔥 Supabase Configuration'));
    console.log(chalk.gray('We will now configure GitHub Secrets required for your App & Database.'));

    // 1. Get Project Ref for Context Links
    const { sbProjectRef } = await inquirer.prompt([{
        type: 'input',
        name: 'sbProjectRef',
        message: 'Enter your Supabase Project Reference ID (e.g. "abcdefghijklmno"):',
        suffix: chalk.gray(' (Used to generate direct links to settings)'),
        validate: (input) => input.length > 5 ? true : 'Project Ref seems too short.'
    }]);

    const dashboardUrl = `https://supabase.com/dashboard/project/${sbProjectRef}`;

    // 2. Prompt for Credentials
    console.log(chalk.cyan(`\n🔹 Database Connection (DATABASE_URL)`));
    console.log(`   Go to: ${chalk.bold('Project Settings -> Database -> Connection String')}`);
    console.log(`   Direct Link: ${chalk.bold.underline(`${dashboardUrl}/settings/database`)}`);
    console.log(`   Action: Select ${chalk.bold('URI')} tab. Copy the string.`);
    console.log(chalk.gray(`   (Ideally use Transaction Mode / Port 6543 for serverless environments)`));
    console.log(chalk.yellow.bold(`   ⚠  CRITICAL: You MUST replace '[YOUR-PASSWORD]' in the string with your actual DB password!`));

    const { dbUrl } = await inquirer.prompt([{
        type: 'password',
        name: 'dbUrl',
        message: 'Paste Connection String (URI):',
        mask: '*'
    }]);

    console.log(chalk.cyan(`\n🔹 API Configuration (SUPABASE_URL, Keys)`));
    console.log(`   Go to: ${chalk.bold('Project Settings -> API')}`);
    console.log(`   Direct Link: ${chalk.bold.underline(`${dashboardUrl}/settings/api`)}`);

    const { apiUrl, anonKey, serviceRoleKey } = await inquirer.prompt([
        {
            type: 'input',
            name: 'apiUrl',
            message: `Paste ${chalk.bold('Project URL')} (SUPABASE_URL):`,
            suffix: chalk.gray(' (e.g. https://xyz.supabase.co)')
        },
        {
            type: 'password',
            name: 'anonKey',
            message: `Paste ${chalk.bold('anon')} / ${chalk.bold('public')} Key (SUPABASE_ANON_KEY):`,
            mask: '*'
        },
        {
            type: 'password',
            name: 'serviceRoleKey',
            message: `Paste ${chalk.bold('service_role')} Key (SUPABASE_SERVICE_ROLE_KEY):`,
            suffix: chalk.red.bold(' (Keep this secret!)'),
            mask: '*'
        }
    ]);

    // 3. Set Secrets
    const spinner = ora(`Setting Supabase Secrets in GitHub Environment '${env.name}'...`).start();
    const repoFlag = repo ? ['-R', repo] : [];

    const secrets = {
        'DATABASE_URL': dbUrl,
        'SUPABASE_URL': apiUrl,
        'SUPABASE_SERVICE_ROLE_KEY': serviceRoleKey,
        'NEXT_PUBLIC_SUPABASE_URL': apiUrl,       // Client needs this
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': anonKey  // Client needs this
    };

    try {
        for (const [key, value] of Object.entries(secrets)) {
            await runCmd('gh', ['secret', 'set', key, '--env', env.name, '--body', value as string, ...repoFlag]);
        }
        spinner.succeed(chalk.green('Supabase Secrets configured successfully!'));
    } catch (e: any) {
        spinner.fail('Failed to set secrets.');
        console.error(chalk.red(e.message));
    }
}

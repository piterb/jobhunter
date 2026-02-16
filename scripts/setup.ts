import { execa } from 'execa';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { run as runEnvWizard } from './init-logic.ts';

async function runCommand(command: string, args: string[], cwd: string = process.cwd()) {
    console.log(chalk.gray(`> ${command} ${args.join(' ')}`));
    const { stdout, stderr } = await execa(command, args, { cwd, stdio: 'inherit' });
    return { stdout, stderr };
}

async function main() {
    console.log(chalk.bold.cyan('\n🚀 JobHunter Full Stack Setup\n'));

    try {
        // 1. Docker Compose
        console.log(chalk.blue('🐳 Step 1: Starting Infrastructure (Docker)...'));
        try {
            await runCommand('docker-compose', ['up', '-d']);
            console.log(chalk.green('✅ Docker containers are up!\n'));
        } catch (err) {
            console.error(chalk.red('❌ Docker Compose failed. Is Docker running?'));
            process.exit(1);
        }

        // 2. Environment Wizard
        console.log(chalk.blue('🔐 Step 2: Environment Configuration...'));
        await runEnvWizard();
        console.log(chalk.green('✅ Environment configured!\n'));

        // 3. Labelling dependencies (optional but helpful)
        console.log(chalk.blue('📦 Step 3: Installing Dependencies...'));
        await runCommand('npm', ['install']);
        console.log(chalk.green('✅ Dependencies installed!\n'));

        // 4. DB Migrations
        console.log(chalk.blue('🔄 Step 4: Running Database Migrations...'));
        await runCommand('npm', ['run', 'migrate'], path.join(process.cwd(), 'server'));
        console.log(chalk.green('✅ Migrations completed!\n'));

        // 5. DB Seed
        console.log(chalk.blue('🌱 Step 5: Seeding Database...'));
        await runCommand('npm', ['run', 'seed'], path.join(process.cwd(), 'server'));
        console.log(chalk.green('✅ Database seeded!\n'));

        console.log(chalk.bold.green('✨ SETUP COMPLETE! ✨\n'));
        console.log(chalk.white('You can now start the application:'));
        console.log(chalk.cyan('  npm run dev\n'));

    } catch (err) {
        console.error(chalk.red('\n💥 Fatal setup error:'), err);
        process.exit(1);
    }
}

main();

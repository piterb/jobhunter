import { execa } from 'execa';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { run as runEnvWizard } from './init-logic.ts';

const ROOT_DIR = process.cwd();
const KCADMIN_TARGET = 'local';
const KCADMIN_REALM_FILE = path.join(ROOT_DIR, 'kcadmin', 'realms', 'jobhunter.json');
const KCADMIN_SEED_FILE = path.join(ROOT_DIR, 'kcadmin', 'seeds', 'jobhunter.json');

async function runCommand(command: string, args: string[], cwd: string = process.cwd()) {
    console.log(chalk.gray(`> ${command} ${args.join(' ')}`));
    const { stdout, stderr } = await execa(command, args, { cwd, stdio: 'inherit' });
    return { stdout, stderr };
}

async function isDockerStackRunning(cwd: string = process.cwd()) {
    try {
        const { stdout } = await execa('docker-compose', ['ps', '-q'], { cwd });
        return stdout.trim().length > 0;
    } catch {
        return false;
    }
}

async function containerExists(containerName: string) {
    try {
        const { stdout } = await execa('docker', ['ps', '-a', '--filter', `name=^/${containerName}$`, '--format', '{{.Names}}']);
        return stdout.split('\n').map((s) => s.trim()).includes(containerName);
    } catch {
        return false;
    }
}

async function hasAnyManagedContainers() {
    const checks = await Promise.all([
        containerExists('jobhunter-db'),
        containerExists('jobhunter-fake-gcs'),
        containerExists('keycloak-local-postgres-1'),
        containerExists('keycloak-local-keycloak-1'),
    ]);
    return checks.some(Boolean);
}

async function isKeycloakRuntimeRunning() {
    const checks = await Promise.all([
        containerExists('keycloak-local-postgres-1'),
        containerExists('keycloak-local-keycloak-1'),
    ]);
    return checks.some(Boolean);
}

async function removeContainerIfExists(containerName: string) {
    try {
        const { stdout } = await execa('docker', ['ps', '-a', '--filter', `name=^/${containerName}$`, '--format', '{{.Names}}']);
        if (stdout.split('\n').map((s) => s.trim()).includes(containerName)) {
            console.log(chalk.yellow(`🧹 Removing stale container: ${containerName}`));
            await runCommand('docker', ['rm', '-f', containerName]);
        }
    } catch {
        // If docker is unavailable, regular setup flow will fail with a clearer message.
    }
}

async function main() {
    console.log(chalk.bold.cyan('\n🚀 JobHunter Full Stack Setup\n'));

    try {
        // 1. Docker Compose
        console.log(chalk.blue('🐳 Step 1: Starting Infrastructure (Docker + Keycloak)...'));
        try {
            const hasContainers = await hasAnyManagedContainers();
            const stackRunning = await isDockerStackRunning();
            const keycloakRunning = await isKeycloakRuntimeRunning();

            if (hasContainers) {
                const { resetMode } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'resetMode',
                        message: 'Existing JobHunter/Keycloak containers detected. How do you want to reset?',
                        choices: [
                            {
                                name: 'Runtime reset only (keep DB and storage data) (Recommended)',
                                value: 'runtime',
                            },
                            {
                                name: 'Full reset (remove containers, DB volume and local storage files)',
                                value: 'full',
                            },
                        ],
                        default: 'runtime',
                    }
                ]);

                if (resetMode === 'full') {
                    console.log(chalk.yellow('🔥 Full reset selected. Removing containers + volumes + storage-data...'));
                    await runCommand('docker-compose', ['down', '-v', '--remove-orphans']);
                    await runCommand('kcadmin', ['down', '--target', KCADMIN_TARGET, '--wipe']);
                    await fs.emptyDir(path.join(process.cwd(), 'storage-data'));
                } else {
                    if (stackRunning || keycloakRunning) {
                        console.log(chalk.yellow('♻️  Runtime reset selected. Restarting containers (data preserved)...'));
                    } else {
                        console.log(chalk.yellow('♻️  Runtime reset selected. Cleaning stale containers...'));
                    }
                    if (stackRunning) {
                        await runCommand('docker-compose', ['down']);
                    }
                    if (keycloakRunning) {
                        await runCommand('kcadmin', ['down', '--target', KCADMIN_TARGET]);
                    }
                }
            } else if (stackRunning) {
                console.log(chalk.yellow('♻️  Existing Docker stack detected. Restarting from clean state...'));
                await runCommand('docker-compose', ['down']);
            }

            // Handle stale containers not attached to current compose project.
            await removeContainerIfExists('jobhunter-db');
            await removeContainerIfExists('jobhunter-fake-gcs');
            await runCommand('docker-compose', ['up', '-d']);
            await runCommand('kcadmin', ['up', '--target', KCADMIN_TARGET]);
            await runCommand('kcadmin', ['realm', 'apply', '--file', KCADMIN_REALM_FILE, '--target', KCADMIN_TARGET]);
            await runCommand('kcadmin', ['seed', 'apply', '--realm', 'jobhunter', '--file', KCADMIN_SEED_FILE, '--target', KCADMIN_TARGET]);
            console.log(chalk.green('✅ Docker containers and Keycloak are up!\n'));
        } catch (err) {
            console.error(chalk.red('❌ Infrastructure startup failed. Is Docker running and is kcadmin installed?'));
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
        console.log(chalk.white('Start the application in two terminals:'));
        console.log(chalk.cyan('  npm run dev -w server'));
        console.log(chalk.cyan('  npm run dev -w client\n'));
        console.log(chalk.white('Local Keycloak:'));
        console.log(chalk.cyan('  URL: http://localhost:8080'));
        console.log(chalk.cyan('  Admin: admin / admin'));
        console.log(chalk.cyan('  Test user: jobhunter.tester@local.test / Jobhunter123!\n'));

    } catch (err) {
        console.error(chalk.red('\n💥 Fatal setup error:'), err);
        process.exit(1);
    }
}

main();

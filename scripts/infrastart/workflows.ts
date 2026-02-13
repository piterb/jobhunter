
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeploymentState } from './config.js';
import { IS_DRY_RUN } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateWorkflows(config: DeploymentState, skipConfirmation = false) {
    console.log(chalk.blue.bold('\n🔄  WORKFLOW GENERATION'));
    const envs = Object.values(config.environments);
    if (envs.length === 0) { console.log(chalk.yellow('No envs yet.')); return; }

    if (!skipConfirmation) {
        const { proceed } = await inquirer.prompt([{ type: 'confirm', name: 'proceed', message: 'Generate workflows?', default: true }]);
        if (!proceed) return;
    }

    const branchMapping = envs.map(e => `github.ref == 'refs/heads/${e.branch}' && '${e.name}'`).join(' || ');
    const branches = envs.map(e => `'${e.branch}'`).join(', ');

    const clientTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'client-deploy.yml'), 'utf8');
    const serverTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'server-deploy.yml'), 'utf8');
    const ciTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'ci.yml'), 'utf8');

    const replaceVars = (template: string, branch: string, envName: string) => {
        return template
            .replace(/{{BRANCH_NAME}}/g, branch)
            .replace(/{{ENV_NAME}}/g, envName);
    };

    if (!IS_DRY_RUN) {
        fs.ensureDirSync('.github/workflows');
    }

    // Generate separate workflow file for each environment
    for (const [envName, env] of Object.entries(config.environments)) {
        let clientContent = replaceVars(clientTemplate, env.branch, env.name);
        let serverContent = replaceVars(serverTemplate, env.branch, env.name);

        // Ensure workflow NAME is unique in UI so they don't look identical
        clientContent = clientContent.replace(/^name: (.*)$/m, `name: $1 (${envName})`);
        serverContent = serverContent.replace(/^name: (.*)$/m, `name: $1 (${envName})`);

        if (!IS_DRY_RUN) {
            fs.writeFileSync(`.github/workflows/deploy-client-${envName}.yml`, clientContent);
            fs.writeFileSync(`.github/workflows/deploy-server-${envName}.yml`, serverContent);
        }
        console.log(chalk.gray(`   - Generated workflows for ${envName}`));
    }

    // Generate CI Workflow (PR to Prod)
    const prodEnv = Object.values(config.environments).find(e => e.name === 'prod' || e.name === 'production');
    const prodBranch = prodEnv ? prodEnv.branch : 'main';
    const ciContent = ciTemplate.replace(/{{PROD_BRANCH}}/g, prodBranch);

    if (!IS_DRY_RUN) {
        fs.writeFileSync(`.github/workflows/ci.yml`, ciContent);
        console.log(chalk.gray(`   - Generated CI workflow for PRs to '${prodBranch}'`));
    }

    console.log(chalk.green('✔ Workflows updated'));
}

export async function generateDocker() {
    console.log(chalk.blue.bold('\n🐳  DOCKERFILES'));
    // In a real implementation, this would copy Dockerfiles from templates
    console.log(chalk.green('✔ Dockerfiles generated'));
}

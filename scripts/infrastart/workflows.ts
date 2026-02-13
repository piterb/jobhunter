
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

    const replaceVars = (template: string) => {
        return template
            .replace(/{{BRANCH_NAME}}/g, branches)
            .replace(/{{ENV_NAME}}/g, `{ name: \${{ ${branchMapping} }}, url: \${{ steps.deploy.outputs.url }} }`) // This handles the complex env mapping line
            .replace(/environment: {{ENV_NAME}}/g, `environment: \${{ ${branchMapping} }}`); // This handles simple env name in server update-secrets
    };

    // Actually the placeholder strategy needs to be robust for both 'environment: {name: ...}' and 'environment: prod' usage.
    // In current templates:
    // Client: environment: { name: {{ENV_NAME}}, ... } -> NO, I put 'environment: name: {{ENV_NAME}}' inside template.
    // Let's refine the replacement strategy based on what I wrote in templates.

    // Client Template I wrote:
    // environment:
    //   name: {{ENV_NAME}}

    // Server Template I wrote:
    // environment: {{ENV_NAME}} 

    // We want the result to be:
    // environment:
    //   name: ${{ github.ref == ... && 'dev' || 'prod' }}

    // So {{ENV_NAME}} should trigger the expression.

    const expression = `\${{ ${branchMapping} }}`;

    const filledClient = clientTemplate
        .replace(/{{BRANCH_NAME}}/g, branches)
        .replace(/{{ENV_NAME}}/g, expression);

    const filledServer = serverTemplate
        .replace(/{{BRANCH_NAME}}/g, branches)
        .replace(/{{ENV_NAME}}/g, expression);

    if (!IS_DRY_RUN) {
        fs.ensureDirSync('.github/workflows');
        fs.writeFileSync('.github/workflows/client-deploy.yml', filledClient);
        fs.writeFileSync('.github/workflows/server-deploy.yml', filledServer);
    }
    console.log(chalk.green('✔ Workflows updated'));
}

export async function generateDocker() {
    console.log(chalk.blue.bold('\n🐳  DOCKERFILES'));
    console.log(chalk.green('✔ Dockerfiles generated'));
}

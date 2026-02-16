import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const ROOT_DIR = process.cwd();
const SERVER_EXAMPLE_PATH = path.join(ROOT_DIR, 'server', '.env.example');
const CLIENT_EXAMPLE_PATH = path.join(ROOT_DIR, 'client', '.env.example');
const SERVER_ENV_PATH = path.join(ROOT_DIR, 'server', '.env.local');
const CLIENT_ENV_PATH = path.join(ROOT_DIR, 'client', '.env.local');

type EnvEntry = {
    key: string;
    defaultValue: string;
};

const ENV_LINE = /^([A-Z0-9_]+)=(.*)$/;

const parseEnvEntries = (template: string): EnvEntry[] => {
    return template
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => ENV_LINE.test(line))
        .map((line) => {
            const match = line.match(ENV_LINE)!;
            return { key: match[1], defaultValue: match[2] };
        });
};

const parseExistingEnv = (content: string): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        const match = line.match(ENV_LINE);
        if (match) out[match[1]] = match[2];
    }
    return out;
};

const renderEnvFromTemplate = (template: string, values: Record<string, string>) => {
    const rendered = template
        .split('\n')
        .map((line) => {
            const match = line.match(ENV_LINE);
            if (!match) return line;
            const key = match[1];
            const value = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match[2];
            return `${key}=${value}`;
        })
        .join('\n');
    return rendered.endsWith('\n') ? rendered : `${rendered}\n`;
};

const isSensitiveKey = (key: string) => /(TOKEN|KEY|SECRET|PASSWORD)/.test(key);

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const backupIfExists = async (filePath: string) => {
    const exists = await fs.pathExists(filePath);
    if (!exists) return null;
    const backupPath = `${filePath}.bak.${timestamp()}`;
    await fs.copy(filePath, backupPath);
    return backupPath;
};

const collectValues = async (scopeName: string, entries: EnvEntry[], existingValues: Record<string, string>) => {
    console.log(chalk.blue(`\n${scopeName} variables:`));
    const answers: Record<string, string> = {};
    for (const entry of entries) {
        const defaultValue = existingValues[entry.key] ?? entry.defaultValue;
        const { value } = await inquirer.prompt([
            {
                type: isSensitiveKey(entry.key) ? 'password' : 'input',
                name: 'value',
                message: `${entry.key}:`,
                default: defaultValue,
                mask: isSensitiveKey(entry.key) ? '*' : undefined,
            }
        ]);
        answers[entry.key] = value ?? defaultValue;
    }
    return answers;
};

export async function run() {
    console.log(chalk.cyan('\n⚙️  Environment Configuration Wizard\n'));

    const targets = [SERVER_ENV_PATH, CLIENT_ENV_PATH];
    const existingTargets = (
        await Promise.all(
            targets.map(async (target) => ({ target, exists: await fs.pathExists(target) }))
        )
    ).filter((item) => item.exists);

    if (existingTargets.length > 0) {
        const { overwrite } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `Env files already exist (${existingTargets.map((x) => path.relative(ROOT_DIR, x.target)).join(', ')}). Do you want to update them?`,
                default: false,
            }
        ]);
        if (!overwrite) {
            console.log(chalk.yellow('Skipping environment setup.\n'));
            return;
        }
    }

    const [serverTemplate, clientTemplate] = await Promise.all([
        fs.readFile(SERVER_EXAMPLE_PATH, 'utf-8'),
        fs.readFile(CLIENT_EXAMPLE_PATH, 'utf-8'),
    ]);

    const serverEntries = parseEnvEntries(serverTemplate);
    const clientEntries = parseEnvEntries(clientTemplate);

    const [existingServerEnv, existingClientEnv] = await Promise.all([
        fs.pathExists(SERVER_ENV_PATH) ? fs.readFile(SERVER_ENV_PATH, 'utf-8') : Promise.resolve(''),
        fs.pathExists(CLIENT_ENV_PATH) ? fs.readFile(CLIENT_ENV_PATH, 'utf-8') : Promise.resolve(''),
    ]);

    const serverValues = await collectValues('Server', serverEntries, parseExistingEnv(existingServerEnv));
    const clientValues = await collectValues('Client', clientEntries, parseExistingEnv(existingClientEnv));

    const serverEnvContent = renderEnvFromTemplate(serverTemplate, serverValues);
    const clientEnvContent = renderEnvFromTemplate(clientTemplate, clientValues);

    const backupTargets = [SERVER_ENV_PATH, CLIENT_ENV_PATH];
    const backupResults = await Promise.all(backupTargets.map((target) => backupIfExists(target)));
    const backups = backupResults.filter((x): x is string => Boolean(x));

    await fs.writeFile(SERVER_ENV_PATH, serverEnvContent);
    await fs.writeFile(CLIENT_ENV_PATH, clientEnvContent);

    console.log(chalk.green('\n✅ Wrote:'));
    console.log(chalk.gray(`- ${path.relative(ROOT_DIR, SERVER_ENV_PATH)}`));
    console.log(chalk.gray(`- ${path.relative(ROOT_DIR, CLIENT_ENV_PATH)}\n`));

    if (backups.length > 0) {
        console.log(chalk.yellow('🗂️ Backups created:'));
        backups.forEach((backup) => console.log(chalk.gray(`- ${path.relative(ROOT_DIR, backup)}`)));
        console.log('');
    }
}

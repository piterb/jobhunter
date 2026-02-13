
import chalk from 'chalk';
import { execa } from 'execa';

export const IS_DRY_RUN = process.argv.includes('--dry-run');

export async function runCmd(command: string, args: string[], options: any = {}) {
    if (IS_DRY_RUN) {
        console.log(chalk.gray(`[DRY-RUN] Executing: ${command} ${args.join(' ')}`));
        return { stdout: '' };
    }
    const result = await execa(command, args, options);
    return result;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

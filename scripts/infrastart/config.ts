
export interface EnvironmentConfig {
    name: string;
    branch: string;
    projectId: string;
    region: string;
    repoName: string;
    serviceAccountName: string;
    workloadIdPool: string;
    workloadIdProvider: string;
    wifProviderPath?: string;
    appName?: string; // App name for migrations (e.g. jobhunter)
    serverUrl?: string; // Cloud Run URL for Server (provisioned early)
}

export interface DeploymentState {
    githubRepo: string;
    environments: { [key: string]: EnvironmentConfig };
}

import fs from 'fs-extra';
import path from 'path';

// State File Location
export const STATE_FILE = 'infrastart.json';

export function loadState(): DeploymentState {
    if (fs.existsSync(STATE_FILE)) {
        return fs.readJsonSync(STATE_FILE);
    }
    return { githubRepo: '', environments: {} };
}

export function saveState(state: DeploymentState): void {
    fs.writeJsonSync(STATE_FILE, state, { spaces: 2 });
}

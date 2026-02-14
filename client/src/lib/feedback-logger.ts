/**
 * Simple logger that intercepts fetch and console calls to provide context for feedback reports.
 */

export interface NetworkLog {
    url: string;
    method: string;
    status: number;
    requestHeaders: Record<string, string>;
    requestBody: unknown;
    responseHeaders: Record<string, string>;
    responseBody: unknown;
    timestamp: string;
    duration: number;
}

export interface ConsoleLog {
    type: 'log' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

class FeedbackLogger {
    private networkLogs: NetworkLog[] = [];
    private consoleLogs: ConsoleLog[] = [];
    private maxLogs = 50;

    init() {
        if (typeof window === 'undefined') return;

        this.interceptFetch();
        this.interceptConsole();
    }

    private interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = Date.now();
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
            const method = args[1]?.method || 'GET';

            // Extract request headers
            const requestHeaders: Record<string, string> = {};
            if (args[1]?.headers) {
                if (args[1].headers instanceof Headers) {
                    args[1].headers.forEach((v, k) => {
                        requestHeaders[k] = k.toLowerCase() === 'authorization' ? 'Bearer [MASKED]' : v;
                    });
                } else if (Array.isArray(args[1].headers)) {
                    args[1].headers.forEach(([k, v]) => {
                        requestHeaders[k] = k.toLowerCase() === 'authorization' ? 'Bearer [MASKED]' : v;
                    });
                } else {
                    Object.entries(args[1].headers).forEach(([k, v]) => {
                        requestHeaders[k] = k.toLowerCase() === 'authorization' ? 'Bearer [MASKED]' : v;
                    });
                }
            }

            let requestBody = null;
            if (args[1]?.body) {
                try {
                    requestBody = JSON.parse(args[1].body as string);
                } catch {
                    requestBody = '[Non-JSON binary or text body]';
                }
            }

            try {
                const response = await originalFetch(...args);
                const duration = Date.now() - start;

                // Extract response headers
                const responseHeaders: Record<string, string> = {};
                response.headers.forEach((v, k) => {
                    responseHeaders[k] = v;
                });

                const clonedResponse = response.clone();
                let responseBody = null;

                try {
                    responseBody = await clonedResponse.json();
                } catch {
                    responseBody = '[Non-JSON response]';
                }

                this.addNetworkLog({
                    url,
                    method,
                    status: response.status,
                    requestHeaders,
                    requestBody,
                    responseHeaders,
                    responseBody,
                    timestamp: new Date().toISOString(),
                    duration
                });

                return response;
            } catch (error: unknown) {
                this.addNetworkLog({
                    url,
                    method,
                    status: 0,
                    requestHeaders,
                    requestBody,
                    responseHeaders: {},
                    responseBody: { error: error instanceof Error ? error.message : String(error) },
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - start
                });
                throw error;
            }
        };
    }

    private interceptConsole() {
        const types: ('log' | 'warn' | 'error')[] = ['log', 'warn', 'error'];

        types.forEach(type => {
            const original = console[type];
            console[type] = (...args: unknown[]) => {
                const message = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');

                this.addConsoleLog({
                    type,
                    message,
                    timestamp: new Date().toISOString()
                });

                original.apply(console, args);
            };
        });
    }

    private addNetworkLog(log: NetworkLog) {
        this.networkLogs.push(log);
        if (this.networkLogs.length > this.maxLogs) this.networkLogs.shift();
    }

    private addConsoleLog(log: ConsoleLog) {
        this.consoleLogs.push(log);
        if (this.consoleLogs.length > this.maxLogs) this.consoleLogs.shift();
    }

    getLogs() {
        return {
            networkLogs: [...this.networkLogs],
            consoleLogs: [...this.consoleLogs]
        };
    }
}

export const feedbackLogger = new FeedbackLogger();

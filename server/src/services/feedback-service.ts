import { supabase } from '../config/supabase';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface NetworkLog {
    method: string;
    status: number;
    url: string;
    duration: number;
    requestHeaders: Record<string, string>;
    responseHeaders: Record<string, string>;
    requestBody: unknown;
    responseBody: unknown;
}

export interface ConsoleLog {
    type: 'log' | 'warn' | 'error' | 'info';
    timestamp: string;
    message: string;
}

export interface FeedbackData {
    subject: string;
    description: string;
    screenshot?: string; // Base64
    networkLogs: NetworkLog[];
    consoleLogs: ConsoleLog[];
    metadata: {
        url: string;
        userEmail?: string;
        browser: string;
        os: string;
        viewport: { width: number; height: number };
        timestamp: string;
    };
    dryRun?: boolean;
}

const appName = process.env.APP_NAME || 'jobhunter';

export class FeedbackService {
    private static BUCKET_NAME = `${appName}-feedback-reports`;

    static async generateAndUploadReport(data: FeedbackData): Promise<string> {
        const htmlContent = this.generateHtml(data);
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const fileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${uniqueId}.html`;

        if (data.dryRun) {
            console.log('[FeedbackService] DryRun enabled: skipping upload and GitHub issue creation');
            return `https://dummy-storage.supabase.co/storage/v1/object/public/${this.BUCKET_NAME}/${fileName}`;
        }

        // Ensure bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.find(b => b.name === this.BUCKET_NAME);

        if (!exists) {
            const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
                public: true,
                fileSizeLimit: 50 * 1024 * 1024
            });
            if (createError) {
                console.error('Error creating bucket:', createError);
                throw new Error(`Failed to create bucket: ${createError.message}`);
            }
        }

        // Upload report
        const { error: uploadError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(fileName, htmlContent, {
                contentType: 'text/html',
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading feedback report:', uploadError);
            throw new Error(`Failed to upload report: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(fileName);

        // Optional: Create GitHub Issue
        try {
            await this.createGitHubIssue(data, publicUrl);
        } catch (err) {
            console.error('Failed to create GitHub issue:', err);
            // Don't fail the whole request if GitHub fails
        }

        return publicUrl;
    }

    private static async createGitHubIssue(data: FeedbackData, reportUrl: string) {
        const token = process.env.FEEDBACK_GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const env = process.env.APP_ENV || 'local';

        if (!token || !owner || !repo) {
            console.warn('GitHub integration skipped: FEEDBACK_GITHUB_TOKEN, owner or repo missing');
            return;
        }

        const body = `
### 📝 Feedback Details
**Subject:** ${data.subject}
**User:** ${data.metadata.userEmail || 'Anonymous'}
**Environment:** \`${env.toUpperCase()}\`
**Timestamp:** ${new Date(data.metadata.timestamp).toLocaleString()}

---

### 🔍 Analysis
**[📥 Download & View Interactive Report](${reportUrl}?download=feedback_report.html)**

---

### 🛠 Metadata
- **URL:** ${data.metadata.url}
- **Browser:** ${data.metadata.browser}
- **OS:** ${data.metadata.os}
- **Viewport:** ${data.metadata.viewport.width}x${data.metadata.viewport.height}

### 📝 Description
${data.description}
        `;

        await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
                title: `[Feedback][${env.toUpperCase()}] ${data.subject}`,
                body,
                labels: ['feedback', `env:${env.toLowerCase()}`]
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
    }

    private static generateHtml(data: FeedbackData): string {
        const networkLogsHtml = data.networkLogs.map((log, i) => `
            <div class="log-item ${log.status >= 400 ? 'error' : ''}">
                <div class="log-header" onclick="toggleDetails('net-${i}')">
                    <span class="method">${log.method}</span>
                    <span class="status">${log.status}</span>
                    <span class="url">${log.url}</span>
                    <span class="duration">${log.duration}ms</span>
                </div>
                <div id="net-${i}" class="log-details">
                    <div class="meta-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 1rem;">
                        <div>
                            <div class="subtitle">Request Headers:</div>
                            <pre style="max-height: 200px;">${JSON.stringify(log.requestHeaders, null, 2)}</pre>
                        </div>
                        <div>
                            <div class="subtitle">Response Headers:</div>
                            <pre style="max-height: 200px;">${JSON.stringify(log.responseHeaders, null, 2)}</pre>
                        </div>
                    </div>
                    <div class="subtitle">Request Body:</div>
                    <pre>${JSON.stringify(log.requestBody, null, 2)}</pre>
                    <div class="subtitle">Response Body:</div>
                    <pre>${JSON.stringify(log.responseBody, null, 2)}</pre>
                </div>
            </div>
        `).join('');

        const consoleLogsHtml = data.consoleLogs.map(log => `
            <div class="console-item ${log.type}">
                <span class="timestamp">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span class="type">${log.type.toUpperCase()}:</span>
                <span class="message">${log.message}</span>
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback: ${data.subject}</title>
    <style>
        :root {
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --primary: #38bdf8;
            --error: #ef4444;
            --warning: #f59e0b;
            --success: #10b981;
            --border: #334155;
        }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 2rem;
            line-height: 1.5;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        header { 
            margin-bottom: 2rem; 
            padding-bottom: 2rem; 
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        h1 { margin: 0; font-size: 1.875rem; color: var(--primary); }
        .meta-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 1rem; 
            margin-top: 1.5rem;
        }
        .meta-item { background: var(--card-bg); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); }
        .meta-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .meta-value { font-weight: 500; margin-top: 0.25rem; word-break: break-all; }
        
        .description-box {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 0.75rem;
            border-left: 4px solid var(--primary);
            margin-bottom: 2rem;
        }

        .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        
        .screenshot-container {
            background: var(--card-bg);
            padding: 1rem;
            border-radius: 0.75rem;
            border: 1px solid var(--border);
            margin-bottom: 2rem;
            text-align: center;
        }
        .screenshot-container img { 
            max-width: 100%; 
            border-radius: 0.375rem; 
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
            cursor: zoom-in;
        }

        .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .tab { 
            padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; color: var(--text-muted); 
            transition: all 0.2s; font-weight: 500;
        }
        .tab.active { background: var(--primary); color: var(--bg); }
        
        .log-item { background: var(--card-bg); border-radius: 0.5rem; margin-bottom: 0.5rem; border: 1px solid var(--border); overflow: hidden; }
        .log-header { padding: 0.75rem 1rem; display: flex; gap: 1rem; align-items: center; cursor: pointer; font-family: monospace; font-size: 0.875rem; }
        .log-header:hover { background: #2d3748; }
        .log-item.error { border-left: 3px solid var(--error); }
        .method { font-weight: bold; color: var(--primary); width: 60px; }
        .status { font-weight: bold; color: var(--success); width: 40px; }
        .error .status { color: var(--error); }
        .url { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .duration { color: var(--text-muted); font-size: 0.75rem; }
        
        .log-details { padding: 1rem; border-top: 1px solid var(--border); display: none; background: #0a0f1a; }
        .subtitle { font-size: 0.75rem; color: var(--text-muted); margin: 1rem 0 0.5rem 0; text-transform: uppercase; }
        pre { margin: 0; padding: 1rem; background: #1a202c; border-radius: 0.375rem; overflow-x: auto; font-size: 0.75rem; color: #e2e8f0; }

        .console-item { padding: 0.5rem 1rem; font-family: monospace; font-size: 0.8125rem; border-bottom: 1px solid var(--border); }
        .console-item.error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
        .console-item.warn { background: rgba(245, 158, 11, 0.1); color: #fcd34d; }
        .timestamp { color: var(--text-muted); margin-right: 0.5rem; }
        .type { font-weight: bold; margin-right: 0.5rem; }

        #network-tab-content, #console-tab-content { display: none; }
        #network-tab-content.active, #console-tab-content.active { display: block; }

        /* Modal for full screenshot */
        #zoom-modal {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 1000; justify-content: center; align-items: center; cursor: zoom-out;
        }
        #zoom-modal img { max-width: 95%; max-height: 95%; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div style="flex: 1;">
                <h1 style="margin-bottom: 1rem;">${data.subject}</h1>
                <div class="meta-item">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1rem;">
                        <div>
                            <div class="meta-label">Submitted By</div>
                            <div class="meta-value">${data.metadata.userEmail || 'Anonymous'}</div>
                        </div>
                        <div>
                            <div class="meta-label">Timestamp</div>
                            <div class="meta-value">${new Date(data.metadata.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                    <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                        <div class="meta-label">URL</div>
                        <div class="meta-value" style="color: var(--primary); font-family: monospace; font-size: 0.8125rem;">${data.metadata.url}</div>
                    </div>
                </div>
            </div>
        </header>

        <div class="description-box">
            <div class="meta-label" style="margin-bottom: 0.5rem">Description</div>
            <div style="font-size: 1.125rem">${data.description}</div>
        </div>

        <div class="section-title">Visual Snapshot</div>
        <div class="screenshot-container">
            ${data.screenshot ? `<img src="${data.screenshot}" onclick="zoomImage(this.src)">` : '<div style="padding: 2rem; color: var(--text-muted)">No screenshot provided</div>'}
        </div>

        <div class="tabs">
            <div class="tab active" onclick="switchTab('network')">Network (${data.networkLogs.length})</div>
            <div class="tab" onclick="switchTab('console')">Console (${data.consoleLogs.length})</div>
            <div class="tab" onclick="switchTab('meta')">Environment</div>
        </div>

        <div id="network-tab-content" class="active">
            ${networkLogsHtml || '<div style="padding: 2rem; text-align: center; color: var(--text-muted)">No network logs captured</div>'}
        </div>

        <div id="console-tab-content">
            <div style="background: var(--card-bg); border-radius: 0.5rem; border: 1px solid var(--border); overflow: hidden;">
                ${consoleLogsHtml || '<div style="padding: 2rem; text-align: center; color: var(--text-muted)">No console logs captured</div>'}
            </div>
        </div>

        <div id="meta-tab-content" style="display: none">
            <div class="meta-grid">
                <div class="meta-item"><div class="meta-label">Browser</div><div class="meta-value">${data.metadata.browser}</div></div>
                <div class="meta-item"><div class="meta-label">OS</div><div class="meta-value">${data.metadata.os}</div></div>
                <div class="meta-item"><div class="meta-label">Viewport</div><div class="meta-value">${data.metadata.viewport.width} x ${data.metadata.viewport.height}</div></div>
            </div>
        </div>
    </div>

    <div id="zoom-modal" onclick="this.style.display='none'"><img id="zoom-img"></div>

    <script>
        function toggleDetails(id) {
            const el = document.getElementById(id);
            el.style.display = el.style.display === 'block' ? 'none' : 'block';
        }

        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('[id$="-tab-content"]').forEach(c => c.style.display = 'none');
            
            event.target.classList.add('active');
            document.getElementById(tab + '-tab-content').style.display = 'block';
        }

        function zoomImage(src) {
            document.getElementById('zoom-img').src = src;
            document.getElementById('zoom-modal').style.display = 'flex';
        }
    </script>
</body>
</html>
        `;
    }
}

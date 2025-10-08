import { Octokit } from "octokit";

// check for GITHUB_TOKEN environment variable
const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken || githubToken.trim() === "") {
    console.error("[ERROR] The GITHUB_TOKEN environment variable is not set or is empty. Please set it before starting the server.");
    process.exit(1);
}

export const octokit = new Octokit({
    auth: githubToken,
    userAgent: 'typescript-mcp-github-issues v1.0.0'
});

console.log('Octokit initialized with the provided GitHub token.');

const {data: { login }} = await octokit.rest.users.getAuthenticated();

console.log(`Token corresponds to user @${login}`);

export async function getIssues(repo: string, query: string): Promise<string[]> {
    try {
        const response = await octokit.rest.issues.listForRepo({
            owner: login,
            repo,
            state: 'open',
            per_page: 100,
            page: 1
        });

        console.log('[findIssues] Issues found:');
        response.data.forEach(issue => {
            console.log(`- ${issue.title}`);
        });

        const matchingIssues = response.data
            .filter(issue => issue.title.includes(query) || (issue.body && issue.body.includes(query)))
            .map(issue => issue.title);
        return matchingIssues;
    } catch (error: any) {
        console.error('[findIssues] Error finding issues:', error.message || error);
        throw error;
    }
}

export async function createIssue(repo: string, title: string, body: string) {
    try {
        const response = await octokit.rest.issues.create({
            owner: login,
            repo,
            title,
            body
        });
        console.log(`[createIssues] Issue created: "${response.data.title}" @ (${response.data.html_url})`);
        return response.data;
    } catch (error: any) {
        console.error('[createIssues] Error creating issue:', error.message || error);
        throw error;
    }
}

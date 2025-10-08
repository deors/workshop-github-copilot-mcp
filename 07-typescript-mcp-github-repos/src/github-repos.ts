import { Octokit } from "octokit";

// check for GITHUB_TOKEN environment variable
const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken || githubToken.trim() === "") {
    console.error("[ERROR] The GITHUB_TOKEN environment variable is not set or is empty. Please set it before starting the server.");
    process.exit(1);
}

export const octokit = new Octokit({
    auth: githubToken,
    userAgent: 'typescript-mcp-github-repos v1.0.0'
});

console.log('Octokit initialized with the provided GitHub token.');

const {data: { login }} = await octokit.rest.users.getAuthenticated();

console.log(`Token corresponds to user @${login}`);

export async function getRepo(query: string): Promise<string[]> {
    try {
        const response = await octokit.rest.repos.listForAuthenticatedUser({
            visibility: 'public',
            affiliation: 'owner',
            sort: 'full_name',
            direction: 'asc',
            per_page: 100,
            page: 1
        });

        console.log('[findRepo] Repositories found:');
        response.data.forEach(repo => {
            console.log(`- ${repo.name}`);
        });

        const matchingRepos = response.data
            .filter(repo => repo.name.includes(query))
            .map(repo => repo.name);
        return matchingRepos;
    } catch (error: any) {
        console.error('[findRepo] Error finding repositories:', error.message || error);
        throw error;
    }
}

export async function createRepo(name: string, description: string, isPrivate: boolean) {
    try {
        const response = await octokit.rest.repos.createForAuthenticatedUser({
            name,
            description,
            private: isPrivate
        });
        console.log(`[createRepo] Repository created: "${response.data.full_name}" @ (${response.data.html_url})`);
        return response.data;
    } catch (error: any) {
        console.error('[createRepo] Error creating repository:', error.message || error);
        throw error;
    }
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getIssues, createIssue } from './github-issues.js';

export async function addTools(server: McpServer) {
    server.tool(
        'findIssues',
        'Finds GitHub issues based on a query string.',
        {
            repo: z.string().describe('The repository to search for issues.'),
            query: z.string().describe('A query string to find matching issues.')
        },
        async ({ repo, query }) => {
            console.log(`[findIssues] Received request for repo "${repo}" with query "${query}"`);
            let message: string;
            const foundIssues = await getIssues(repo, query);
            if (foundIssues.length > 0) {
                console.log(`[findIssues] Found ${foundIssues.length} issues matching "${query}":`, foundIssues);
                const header = `| ## |                   Issue Title                    |\n|----|--------------------------------------------------|`;
                const rows = foundIssues.map((title, idx) => `| ${String(idx + 1).padStart(2)} | ${title.slice(0, 48).padEnd(48)} |`).join('\n');
                message = `Issues found matching "${query}":\n${header}\n${rows}`;
            } else {
                message = `No issues found matching "${query}".`;
            }
            const response: any = {
                content: [
                    {
                        type: 'text',
                        text: message
                    },
                ],
            };
            console.log(`[findIssues] Responding with:`, response);
            return response;
        }
    );
    console.log('Registered tool: findIssues');

    server.tool(
        'createIssue',
        'Creates a new GitHub issue.',
        {
            repo: z.string().describe('The repository to create the issue in.'),
            title: z.string().describe('The title of the issue.'),
            body: z.string().describe('The body of the issue.')
        },
        async ({ repo, title, body }) => {
            console.log(`[createIssue] Received request to create an issue in repo "${repo}" with title "${title}"`);
            const creationResult = await createIssue(repo, title, body);
            const response: any = {
                content: [
                    {
                        type: 'text',
                        text: `Issue created in repo "${repo}" with title "${title}": ${creationResult.html_url}`
                    }
                ]
            };
            console.log(`[createIssue] Responding with:`, response);
            return response;
        }
    );
    console.log('Registered tool: createIssue');
}

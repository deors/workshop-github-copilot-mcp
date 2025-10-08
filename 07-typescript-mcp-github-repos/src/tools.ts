import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getRepo, createRepo } from './github-repos.js';

export async function addTools(server: McpServer) {
    server.tool(
        'findRepo',
        'Finds a GitHub repository.',
        {
            query: z.string().describe('A query string to find matching repositories.')
        },
        async ({ query }) => {
            console.log(`[findRepo] Received request with query "${query}"`);
            let message: string;
            const foundRepos = await getRepo(query);
            if (foundRepos.length > 0) {
                console.log(`[findRepo] Found ${foundRepos.length} repos matching "${query}":`, foundRepos);
                const header = `| ## |                  Repository Name                 |\n|----|--------------------------------------------------|`;
                const rows = foundRepos.map((name, idx) => `| ${String(idx + 1).padStart(2)} | ${name.slice(0, 48).padEnd(48)} |`).join('\n');
                message = `Repositories found matching "${query}":\n${header}\n${rows}`;
            } else {
                message = `No repositories found matching "${query}".`;
            }
            const response: any = {
                content: [
                    {
                        type: 'text',
                        text: message
                    },
                ],
            };
            console.log(`[findRepo] Responding with:`, response);
            return response;
        }
    );
    console.log('Registered tool: findRepo');

    server.tool(
        'createRepo',
        'Creates a new GitHub repository.',
        {
            name: z.string().describe('The name of the repository to create.'),
            description: z.string().describe('A description of the repository.'),
            isPrivate: z.boolean().describe('Whether the repository should be private.')
        },
        async ({ name, description, isPrivate }) => {
            console.log(`[createRepo] Received request to create a repo with name "${name}", description "${description}" and private visibility ${isPrivate}`);
            const creationResult = await createRepo(name, description, isPrivate);
            const response: any = {
                content: [
                    {
                        type: 'text',
                        text: `Repo "${name}" created with description "${description}" and private visibility ${isPrivate} is now available: ${creationResult.html_url}`
                    }
                ]
            };
            console.log(`[createRepo] Responding with:`, response);
            return response;
        }
    );
    console.log('Registered tool: createRepo');
}
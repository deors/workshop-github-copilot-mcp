import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

console.log('Starting MCP server...');
const server = new McpServer({
    name: 'Hello World MCP Server (stdio version)',
    description: 'A simple MCP server that provides greeting functionalities through stdio.',
    version: '1.0.0',
    transport: 'stdio'
});

server.tool(
    'greetPerson',
    'Greets a person by name.',
    {
        name: z.string().describe('The name of the person to greet.'),
    },
    async ({ name }) => {
        console.log(`[greetPerson] Received request with name: ${name}`);
        const response: any = {
            content: [
                {
                    type: 'text',
                    text: `Hello, ${name}!`,
                },
            ],
        };
        console.log(`[greetPerson] Responding with:`, response);
        return response;
    }
);
console.log('Registered tool: greetPerson');

server.tool(
    'greetAudience',
    'Greets the audience of an event, specifying event name and location.',
    {
        event: z.string().describe('The name of the event.'),
        location: z.string().describe('The location of the event.')
    },
    async ({ event, location }) => {
        console.log(`[greetAudience] Received request with event: ${event}, location: ${location}`);
        const response: any = {
            content: [
                {
                    type: 'text',
                    text: `Hello to everyone at ${event} in ${location}!`
                }
            ]
        };
        console.log(`[greetAudience] Responding with:`, response);
        return response;
    }
);
console.log('Registered tool: greetAudience');

console.log('Connecting to stdio transport...');

server.connect(new StdioServerTransport()).then(() => {
        console.log('MCP server is now running and listening for requests.');
    }).catch((err) => {
        console.error('Error starting MCP server:', err);
    });

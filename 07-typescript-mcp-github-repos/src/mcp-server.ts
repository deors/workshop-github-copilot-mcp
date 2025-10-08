import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import { isInitializeRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import express from 'express';
import { randomUUID } from 'node:crypto';
import { addTools } from './tools.js';

console.log('Starting MCP server...');
const server = new McpServer({
    name: 'GitHub repos MCP Server (streamable version)',
    description: 'An MCP server that integrates with GitHub repos through streamable HTTP. The permission boundary is given by the GitHub token provided at runtime in the GITHUB_TOKEN environment variable.',
    version: '1.0.0',
    transport: 'streamable-http'
});

addTools(server);

console.log('Launching MCP Server with Streamable HTTP transport...');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;
const MCP_ENDPOINT = "/stream";

// mapping session ids to transports
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const app = express();
app.use(express.json());

app.post(MCP_ENDPOINT, async (req, res) => {
    console.log(`Received a POST request at ${MCP_ENDPOINT}:`, req.body);

    // capture response to log it
    const captured = res.json;
    res.json = function (body) {
        console.log(`This is the response being sent:`, JSON.stringify(body, null, 2));
        return captured.call(this, body);
    };

    try {
        // gets the session id from headers
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        // gets mapped transport or creates a new one
        if (sessionId && transports[sessionId]) {
            console.log(`Reusing transport for session: ${sessionId}`);
            transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
            console.log('Creating transport for new session request');
            const eventStore = new InMemoryEventStore();
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                enableJsonResponse: true,
                eventStore,
                onsessioninitialized: (sessionId) => {
                    console.log(`New session ${sessionId} initialized`);
                    transports[sessionId] = transport;
                }
            });

            // clean up transport
            transport.onclose = () => {
                const sessionId = transport.sessionId;
                if (sessionId && transports[sessionId]) {
                    console.log(`Transport closed for session ${sessionId}`);
                    delete transports[sessionId];
                }
            };

            // connect the transport to the server
            console.log(`Connecting transport to MCP server...`);
            await server.connect(transport);
            console.log(`Transport connected to MCP server successfully`);

            console.log(`Handling initialization request...`);
            await transport.handleRequest(req, res, req.body);
            console.log(`Initialization request handled successfully`);
            return;
        } else {
            console.error('Bad request: No valid session ID or initialization request');
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID or initialization request provided',
                },
                id: null,
            });
            return;
        }

        console.log(`Handling request for session ${transport.sessionId}`);
        console.log(`Request body:`, JSON.stringify(req.body, null, 2));

        const startTime = Date.now();
        await transport.handleRequest(req, res, req.body);
        const duration = Date.now() - startTime;

        console.log(`Request completed in ${duration}ms for session ${transport.sessionId}`);
    } catch (error) {
        console.error('Error handling the tool request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
});

app.delete(MCP_ENDPOINT, async (req, res) => {
    console.log(`Received a DELETE request at ${MCP_ENDPOINT}:`, req.body);
    try {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
            console.error('Bad request: No valid session ID or initialization request');
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided',
                },
                id: null,
            });
            return;
        }

        console.log(`Received session termination request for session ${sessionId}`);
        const transport = transports[sessionId];

        // capture response to log it
        const captured = res.send;
        res.send = function (body) {
            console.log(`This is the response being sent:`, body);
            return captured.call(this, body);
        };

        console.log(`Handling session termination for session ${sessionId}`);
        console.log(`Request body:`, JSON.stringify(req.body, null, 2));

        const startTime = Date.now();
        await transport.handleRequest(req, res, req.body);
        const duration = Date.now() - startTime;

        console.log(`Session termination completed in ${duration}ms for session ${sessionId}`);

        // check whether transport was actually closed
        setTimeout(() => {
            if (transports[sessionId]) {
                console.warn(`Transport for session ${sessionId} still exists after the session termination request`);
            } else {
                console.log(`Transport for session ${sessionId} successfully removed after the session termination request`);
            }
        }, 100);
    } catch (error) {
        console.error('Error handling the session termination request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
});

const expressServer = app.listen(PORT, () => {
    console.log(`MCP Server with Streamable HTTP transport listening on port ${PORT}`);
});

process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    for (const sessionId in transports) {
        try {
            console.log(`Closing transport for session ${sessionId}`);
            await transports[sessionId].close();
            delete transports[sessionId];
        } catch (error) {
            console.error(`Error closing transport for session ${sessionId}:`, error);
        }
    }
    expressServer.close();
    await server.close();
    console.log("Server shut down completed.");
    process.exit(0);
});

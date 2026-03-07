import type { APIRoute } from 'astro';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { toolHandlers } from "../../lib/tools";

/**
 * A Web-Standard MCP Server implementation for Astro.
 * This handles JSON-RPC requests over POST and is deployable to Vercel.
 */

const mcpServer = new Server(
    {
        name: "astro-agent-api",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define Tools (Expose the same tools as the local MCP and Gemini Agent)
const toolDefinitions = [
    {
        name: "get_weather",
        description: "Get the current weather for a specific location",
        inputSchema: {
            type: "object",
            properties: {
                location: { type: "string", description: "City and state" },
            },
            required: ["location"],
        },
    },
    {
        name: "add_todo",
        description: "Add a new task to the user's todo list",
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string", description: "Task description" },
            },
            required: ["task"],
        },
    },
    {
        name: "list_todos",
        description: "List all current tasks in the todo list",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_current_time",
        description: "Get the current system time and date",
        inputSchema: {
            type: "object",
            properties: {},
        },
    }
];

export const POST: APIRoute = async ({ request }) => {
    try {
        const json = await request.json();
        const { method, params, id } = json;

        let result: any = null;

        if (method === "initialize") {
            result = {
                protocolVersion: "2024-11-05",
                capabilities: {
                    tools: {},
                },
                serverInfo: {
                    name: "astro-agent-http",
                    version: "1.0.0",
                },
            };
        } else if (method === "tools/list") {
            result = { tools: toolDefinitions };
        } else if (method === "tools/call") {
            const { name, arguments: args } = params;
            const handler = (toolHandlers as any)[name];

            if (!handler) {
                return Response.json({
                    jsonrpc: "2.0",
                    id,
                    error: { code: -32601, message: `Tool ${name} not found` },
                });
            }

            const data = await handler(args || {});
            result = {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        } else if (method === "notifications/initialized") {
            return new Response(null, { status: 202 });
        } else {
            return Response.json({
                jsonrpc: "2.0",
                id,
                error: { code: -32601, message: "Method not implemented" },
            });
        }

        return Response.json({
            jsonrpc: "2.0",
            id,
            result,
        });

    } catch (error: any) {
        return Response.json({
            jsonrpc: "2.0",
            error: { code: -32700, message: `Error: ${error.message}` },
        }, { status: 400 });
    }
};

/**
 * GET handler to show that the endpoint is alive
 */
export const GET: APIRoute = async () => {
    return new Response("MCP JSON-RPC Gateway is running. Use POST to interact.", {
        headers: { "Content-Type": "text/plain" },
    });
};

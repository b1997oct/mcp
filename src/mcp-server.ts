import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { toolHandlers } from "./lib/tools.js";

/**
 * MCP Server that exposes the same tools as the Gemini Agent.
 * This allows other tools (like Claude Desktop) to use this app's functionality.
 */

const server = new Server(
    {
        name: "astro-agent-tools",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// 1. List available tools to the MCP client
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_weather",
                description: "Get the current weather for a specific location",
                inputSchema: {
                    type: "object",
                    properties: {
                        location: {
                            type: "string",
                            description: "The city and state, e.g. San Francisco, CA",
                        },
                    },
                    required: ["location"],
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
        ],
    };
});

// 2. Handle tool calls from the MCP client
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        const handler = (toolHandlers as any)[name];
        if (!handler) {
            throw new Error(`Tool ${name} not found`);
        }

        const result = await handler(args || {});

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error: any) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
        };
    }
});

/**
 * Start the server using stdio transport.
 * Run this with: npx tsx src/mcp-server.ts
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
});

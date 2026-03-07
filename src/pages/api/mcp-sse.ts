import type { APIRoute } from 'astro';
import { toolHandlers } from "../../lib/tools";

/**
 * MCP SSE Server Implementation
 * Reference: https://modelcontextprotocol.io/docs/concepts/transports#sse
 */

interface Session {
    controller: ReadableStreamDefaultController;
    encoder: TextEncoder;
    isActive: boolean;
}

// Global session store to route messages from POST requests back to the specific GET stream
const sessions = new Map<string, Session>();

export const GET: APIRoute = async ({ request }) => {
    const encoder = new TextEncoder();
    const sessionId = Math.random().toString(36).substring(7);
    let isActive = true;

    const stream = new ReadableStream({
        start(controller) {
            const url = new URL(request.url);
            // The client POSTs to this URL, usually with the same path + sessionId
            const endpoint = `${url.origin}${url.pathname}?sessionId=${sessionId}`;

            // Register this session's controller
            sessions.set(sessionId, { controller, encoder, isActive: true });

            const safeEnqueue = (event: string, data: string) => {
                if (!isActive) return;
                try {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
                } catch (e) {
                    isActive = false;
                    sessions.delete(sessionId);
                    console.error("[SSE] Stream error, closing session:", sessionId);
                }
            };

            // 1. Send the initial 'endpoint' event per spec
            safeEnqueue('endpoint', endpoint);

            // 2. Keep connection alive with heartbeat
            const keepAlive = setInterval(() => {
                if (request.signal.aborted || !isActive) {
                    clearInterval(keepAlive);
                    sessions.delete(sessionId);
                    return;
                }
                try {
                    controller.enqueue(encoder.encode(`: keep-alive\n\n`));
                } catch (e) {
                    clearInterval(keepAlive);
                    sessions.delete(sessionId);
                }
            }, 15000);

            request.signal.addEventListener('abort', () => {
                isActive = false;
                clearInterval(keepAlive);
                sessions.delete(sessionId);
            });
        },
        cancel() {
            isActive = false;
            sessions.delete(sessionId);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Essential for Vercel/Nginx proxying
        },
    });
};

export const POST: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId || !sessions.has(sessionId)) {
        return new Response("Session not found or expired", { status: 400 });
    }

    const session = sessions.get(sessionId)!;

    try {
        const json = await request.json();
        const { method, params, id } = json;

        // Tool Definitions (shared with local MCP server)
        const toolDefinitions = [
            {
                name: "get_weather",
                description: "Get the current weather for a specific location",
                inputSchema: {
                    type: "object",
                    properties: { location: { type: "string" } },
                    required: ["location"],
                },
            },
            {
                name: "add_todo",
                description: "Add a new task to the user's todo list",
                inputSchema: {
                    type: "object",
                    properties: { task: { type: "string" } },
                    required: ["task"],
                },
            },
            {
                name: "list_todos",
                description: "List all current tasks in the todo list",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "get_current_time",
                description: "Get the current system time and date",
                inputSchema: { type: "object", properties: {} },
            }
        ];

        let result: any = null;

        if (method === "initialize") {
            result = {
                protocolVersion: "2024-11-05",
                capabilities: { tools: {} },
                serverInfo: { name: "astro-agent", version: "1.0.0" }
            };
        } else if (method === "tools/list") {
            result = { tools: toolDefinitions };
        } else if (method === "tools/call") {
            const { name, arguments: args } = params;
            const handler = (toolHandlers as any)[name];
            if (!handler) throw new Error(`Tool ${name} not found`);
            const data = await handler(args || {});
            result = { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } else if (method === "notifications/initialized") {
            // Basic lifecycle message from clients like Claude
            return new Response(null, { status: 202 });
        } else {
            // Default success/empty result for unsupported or generic methods
            result = {};
        }

        // IMPORTANT: In MCP SSE, the response is sent back via the SSE stream, NOT the POST body.
        const responseJson = JSON.stringify({
            jsonrpc: "2.0",
            id,
            result
        });

        if (session.isActive) {
            try {
                session.controller.enqueue(session.encoder.encode(`event: message\ndata: ${responseJson}\n\n`));
            } catch (e) {
                session.isActive = false;
                sessions.delete(sessionId);
            }
        }

        // Return 202 Accepted with no body as per spec
        return new Response(null, { status: 202 });

    } catch (error: any) {
        const errorJson = JSON.stringify({
            jsonrpc: "2.0",
            id: (await request.json().catch(() => ({}))).id || null,
            error: { code: -32603, message: error.message }
        });

        if (session.isActive) {
            session.controller.enqueue(session.encoder.encode(`event: message\ndata: ${errorJson}\n\n`));
        }

        return new Response(null, { status: 202 });
    }
};

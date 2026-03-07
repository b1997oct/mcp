## 🤖 MCP Server

This project includes a Model Context Protocol (MCP) server that exposes the same tools as the Gemini Agent (Weather, User Info, Todo List).

### Running the MCP server
To start the MCP server locally:
```sh
npm run mcp
```

### Setup with Claude Desktop (Local)
... (existing local config) ...

## 🌐 Use it from a Link (Deployment)

You can deploy the **Agent UI & API** to Vercel and expose your **MCP Server** via ngrok.

### 1. Deploy the Web UI & API to Vercel
1.  Push your code to GitHub.
2.  Import the project into [Vercel](https://vercel.com).
3.  Add `GOOGLE_API_KEY` to **Project Settings -> Environment Variables**.
4.  Your agent will be at `https://your-project.vercel.app`.

### 2. Use the "Link" version (API)
Your app provides two public endpoints:
*   **Chat API**: `https://your-project.vercel.app/api/chat` (Regular JSON)
*   **MCP Gateway**: `https://your-project.vercel.app/api/mcp` (MCP JSON-RPC)

#### Example Chat Call:
```bash
curl -X POST https://your-project.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What time is it?"}'
```

#### Example MCP Tool List:
```bash
curl -X POST https://your-project.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

### 3. Expose the MCP Server via a Link (Local)
...

## 👀 Want to learn more?
...

## 🤖MCP

### Core Capabilities:
*   **🌦️ Real-time Weather**: Provides current atmospheric conditions for any location.
*   **⏰ System Time**: Syncs the agent with the exact local system clock.
*   **👤 Contextual Awareness**: Accesses local user information to personalize AI responses.
*   **🔌 Universal Connectivity**: Fully compatible with any MCP client (Cursor, Claude Desktop, etc.).

### Running the MCP server
To start the MCP server locally:
```sh
npm run mcp
```

### Setup with Claude Desktop (Local)
... (existing local config) ...

## 🌐 Local Deployment (API)

Once you start the project using `npm run dev`, you can access the **Agent UI & API** locally.

### 1. Local API Endpoints
*   **MCP Gateway**: `http://localhost:3000/api/mcp` (MCP JSON-RPC)


#### Example MCP Tool List:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

**Agent_B1997** helps you to connecting & testing MCP.

...

## 👀 Want to learn more?
...

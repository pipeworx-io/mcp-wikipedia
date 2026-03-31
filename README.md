# mcp-wikipedia

Wikipedia MCP — wraps Wikipedia REST API (free, no auth)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "wikipedia": {
      "url": "https://gateway.pipeworx.io/wikipedia/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use wikipedia
```

## License

MIT

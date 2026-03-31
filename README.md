# mcp-wikipedia

MCP server for Wikipedia. Search articles, get summaries, browse section structure, and discover random articles — free, no API key required.

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|
| `search_wikipedia` | Search Wikipedia articles by keyword |
| `get_article_summary` | Get article summary with description and thumbnail |
| `get_article_sections` | Get the section structure (table of contents) of an article |
| `get_random_articles` | Get random Wikipedia articles |

## Quick Start

```json
{
  "mcpServers": {
    "wikipedia": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://gateway.pipeworx.io/wikipedia/mcp"]
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

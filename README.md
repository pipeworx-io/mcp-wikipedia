# mcp-wikipedia

Wikipedia MCP — wraps Wikipedia REST API (free, no auth)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_wikipedia` | Search Wikipedia for encyclopedic facts, sports event schedules, medal tables, officeholder rosters and biographies. Covers multi-sport games and tournaments edition by edition — Olympics, Asian Games, Commonwealth Games, Pan American Games, SEA Games, World Cup — with per-sport competition schedules, session dates, venues, results and medal tables, each on its own article ("Table tennis at the 2026 Asian Games", "Athletics at the 2028 Summer Olympics"). Use it when the article title is NOT predictable from the question, to find the exact title, then read the article body with get_article_extract; when the title IS predictable ("Table tennis at the 2026 Asian Games") skip straight to get_article_extract, since a search snippet is one truncated line. Also the right tool for government composition and officeholder rosters — "current cabinet members of Japan", "list of ministers and their positions", "who is in the German government", "cabinet of <country> 2025" — Wikipedia keeps cabinet, ministry, and government lists current for every country. And for general knowledge: "who is X", "what is Y", "history of Z", definitions. Returns matching article titles, snippets, page IDs, word counts. Chain with get_article_extract for the full text or a single section. Cheaper + more structured than scraping web search results; covers ~7M English articles updated continuously by the Wikipedia community. |
| `get_article_summary` | AUTHORITATIVE summary of a Wikipedia article by exact title — typically faster + cheaper than search_wikipedia + get_article_sections + scrape. Returns the article's lead paragraph (the editorial overview), one-line description, thumbnail image, and a few related-content links. Use when you already have the canonical title (got it from search_wikipedia, or it's a well-known entity) and need the standard "what is X" prose answer. For the full section breakdown use get_article_sections. |
| `get_article_sections` | Section outline of a Wikipedia article by title — the table-of-contents. Returns all headings + hierarchy (H2, H3, etc.) without the prose. Use when the article is long (history, science topics, biographies) and you want to navigate to a specific section vs reading the entire summary. Chain with get_article_summary for the lead text. Cheap, structural-only. |
| `get_random_articles` | Discover random Wikipedia articles for serendipitous learning. Returns title, introduction text, and page ID. |
| `get_article_extract` | Full text of a Wikipedia article by title — the ACTUAL prose AND its tables, not just the lead paragraph. This is how you read a competition schedule, fixture list, medal table, results grid or roster: get_article_extract({title: "Table tennis at the 2026 Asian Games"}) returns the venue, the dates and the day-by-day event schedule. Answers "when is <sport> at <the games>", "what are the <event> dates", "who won <medal event>", "explain X in detail", "what does the article say about <topic>", reading the history/methods/etc. CALL IT DIRECTLY when the title is predictable from the question — Wikipedia titles are regular, so "when is table tennis at the Asian Games" is the article "Table tennis at the 2026 Asian Games", and the same pattern gives "Athletics at the 2028 Summer Olympics", "India at the 2026 Asian Games", "2026 FIFA World Cup". Constructing the title and reading the article beats searching first, because the search snippet is one truncated line and this returns the whole thing. Titles are exact: on a miss you get a user_error naming search_wikipedia as the recovery. PREFER OVER get_article_summary whenever the lead paragraph is not enough. Omit section for the whole article (capped by max_chars); pass a section number (from get_article_sections) for just that one. Returns plain text with headings marked == like this == and table rows one per line, cells separated by \| . |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "wikipedia": {
      "url": "https://gateway.pipeworx.io/wikipedia/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/wikipedia/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Wikipedia data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

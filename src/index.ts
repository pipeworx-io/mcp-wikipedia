/**
 * Wikipedia MCP — wraps Wikipedia REST API (free, no auth)
 *
 * Tools:
 * - search_wikipedia: search articles by keyword
 * - get_article_summary: get summary for a specific article
 * - get_article_sections: get section structure of an article
 * - get_random_articles: get random Wikipedia articles
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';
const HEADERS = { 'User-Agent': 'pipeworx-mcp' };

// ── API Response Types ────────────────────────────────────────────────

type SearchResult = {
  title: string;
  snippet: string;
  pageid: number;
  wordcount: number;
  size: number;
  timestamp: string;
};

type SearchApiResponse = {
  query: {
    search: SearchResult[];
    searchinfo?: { totalhits: number };
  };
};

type SummaryApiResponse = {
  title: string;
  displaytitle?: string;
  description?: string;
  extract: string;
  pageid?: number;
  thumbnail?: { source: string; width: number; height: number };
  content_urls?: {
    desktop?: { page: string };
    mobile?: { page: string };
  };
};

type ParseApiResponse = {
  parse: {
    title: string;
    pageid: number;
    sections: Array<{
      toclevel: number;
      level: string;
      line: string;
      number: string;
      index: string;
      fromtitle: string;
      byteoffset: number;
      anchor: string;
    }>;
  };
};

// ── Tool Definitions ──────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'search_wikipedia',
    description:
      'Search Wikipedia articles by keyword. Returns title, snippet, page ID, and word count for each result.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: {
          type: 'number',
          description: 'Number of results to return (1-50, default 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_article_summary',
    description:
      'Get a summary for a Wikipedia article by title. Returns the introduction extract, description, thumbnail URL, and content URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Wikipedia article title (e.g., "Albert Einstein")',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_article_sections',
    description:
      'Get the section structure (table of contents) of a Wikipedia article by title. Returns a list of sections with their titles and heading levels.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Wikipedia article title (e.g., "World War II")',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_random_articles',
    description:
      'Get random Wikipedia articles. Returns title, extract, and page ID for each article.',
    inputSchema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of random articles to fetch (1-10, default 5)',
        },
      },
      required: [],
    },
  },
];

// ── Tool Implementations ──────────────────────────────────────────────

async function searchWikipedia(query: string, limit: number) {
  const count = Math.min(50, Math.max(1, limit));
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(count),
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${WIKI_API}?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Wikipedia search error: ${res.status}`);

  const data = (await res.json()) as SearchApiResponse;

  return {
    total_hits: data.query.searchinfo?.totalhits ?? data.query.search.length,
    results: data.query.search.map((item) => ({
      title: item.title,
      snippet: item.snippet.replace(/<[^>]+>/g, ''),
      pageid: item.pageid,
      wordcount: item.wordcount,
    })),
  };
}

async function getArticleSummary(title: string) {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_REST}/page/summary/${encoded}`, {
    headers: HEADERS,
  });

  if (res.status === 404) throw new Error(`Article not found: "${title}"`);
  if (!res.ok) throw new Error(`Wikipedia summary error: ${res.status}`);

  const data = (await res.json()) as SummaryApiResponse;

  return {
    title: data.title,
    description: data.description ?? null,
    extract: data.extract,
    thumbnail_url: data.thumbnail?.source ?? null,
    content_urls: {
      desktop: data.content_urls?.desktop?.page ?? null,
      mobile: data.content_urls?.mobile?.page ?? null,
    },
  };
}

async function getArticleSections(title: string) {
  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    prop: 'sections',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${WIKI_API}?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Wikipedia parse error: ${res.status}`);

  const data = (await res.json()) as ParseApiResponse;

  if (!data.parse) {
    throw new Error(`Article not found: "${title}"`);
  }

  return {
    title: data.parse.title,
    pageid: data.parse.pageid,
    sections: data.parse.sections.map((s) => ({
      title: s.line.replace(/<[^>]+>/g, ''),
      level: parseInt(s.level, 10),
      number: s.number,
      anchor: s.anchor,
    })),
  };
}

async function getRandomArticles(count: number) {
  const n = Math.min(10, Math.max(1, count));

  const fetches = Array.from({ length: n }, () =>
    fetch(`${WIKI_REST}/page/random/summary`, { headers: HEADERS }).then(
      async (res) => {
        if (!res.ok) throw new Error(`Wikipedia random error: ${res.status}`);
        return (await res.json()) as SummaryApiResponse;
      }
    )
  );

  const results = await Promise.all(fetches);

  return {
    articles: results.map((item) => ({
      title: item.title,
      extract: item.extract,
      pageid: item.pageid ?? null,
      description: item.description ?? null,
    })),
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_wikipedia':
      return searchWikipedia(args.query as string, (args.limit as number) ?? 10);
    case 'get_article_summary':
      return getArticleSummary(args.title as string);
    case 'get_article_sections':
      return getArticleSections(args.title as string);
    case 'get_random_articles':
      return getRandomArticles((args.count as number) ?? 5);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool } satisfies McpToolExport;

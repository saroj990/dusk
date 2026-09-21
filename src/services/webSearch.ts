import type { AppSettings, WebSearchHit } from '@/types'

const MAX_HITS = 5
const SNIPPET_CHARS = 420

interface WikipediaQueryResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string
        extract?: string
        fullurl?: string
      }
    >
  }
}

interface DdgInstantResponse {
  Heading?: string
  AbstractText?: string
  AbstractURL?: string
  Answer?: string
  Definition?: string
  DefinitionURL?: string
  Results?: DdgTopic[]
  RelatedTopics?: DdgTopic[]
}

interface DdgTopic {
  Text?: string
  FirstURL?: string
  Topics?: DdgTopic[]
}

function flattenDdgTopics(topics: DdgTopic[] | undefined): WebSearchHit[] {
  const hits: WebSearchHit[] = []
  for (const topic of topics ?? []) {
    if (topic.Topics?.length) {
      hits.push(...flattenDdgTopics(topic.Topics))
      continue
    }
    if (!topic.FirstURL) continue
    hits.push({
      title: clip(topic.Text ?? topic.FirstURL, 80),
      url: topic.FirstURL,
      snippet: clip(topic.Text ?? ''),
    })
  }
  return hits
}

function resolveDdgRedirect(href: string): string {
  try {
    const url = new URL(href, 'https://duckduckgo.com')
    const uddg = url.searchParams.get('uddg')
    if (uddg) return decodeURIComponent(uddg)
    return url.toString()
  } catch {
    return href
  }
}

function parseDdgHtml(html: string): WebSearchHit[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const hits: WebSearchHit[] = []
  const links = doc.querySelectorAll('a.result__a')
  for (const link of links) {
    const href = link.getAttribute('href')
    if (!href) continue
    const url = resolveDdgRedirect(href)
    const title = clip(link.textContent ?? url, 80)
    const snippetEl =
      link.closest('.result')?.querySelector('.result__snippet') ??
      link.parentElement?.parentElement?.querySelector('.result__snippet')
    hits.push({
      title,
      url,
      snippet: clip(snippetEl?.textContent ?? ''),
    })
    if (hits.length >= MAX_HITS) break
  }
  return hits
}

function uniqueHits(hits: WebSearchHit[]): WebSearchHit[] {
  const seen = new Set<string>()
  const out: WebSearchHit[] = []
  for (const hit of hits) {
    const key = hit.url.replace(/\/$/, '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(hit)
    if (out.length >= MAX_HITS) break
  }
  return out
}

async function searchDuckDuckGo(query: string, signal?: AbortSignal): Promise<WebSearchHit[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
    skip_disambig: '1',
    no_redirect: '1',
  })

  const [instantRes, htmlRes] = await Promise.allSettled([
    fetch(`/ddg-search/?${params.toString()}`, { signal }),
    fetch(`/ddg-html/?q=${encodeURIComponent(query)}`, { signal }),
  ])

  const hits: WebSearchHit[] = []

  if (htmlRes.status === 'fulfilled' && htmlRes.value.ok) {
    const html = await htmlRes.value.text()
    hits.push(...parseDdgHtml(html))
  }

  if (instantRes.status === 'fulfilled' && instantRes.value.ok) {
    const data = (await instantRes.value.json()) as DdgInstantResponse
    if (data.AbstractText && data.AbstractURL) {
      hits.unshift({
        title: data.Heading || 'DuckDuckGo',
        url: data.AbstractURL,
        snippet: clip(data.AbstractText),
      })
    } else if (data.Answer) {
      hits.unshift({
        title: data.Heading || query,
        url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: clip(data.Answer),
      })
    }
    hits.push(...flattenDdgTopics(data.Results))
    hits.push(...flattenDdgTopics(data.RelatedTopics))
  }

  const unique = uniqueHits(hits)
  if (!unique.length) {
    throw new Error(
      'DuckDuckGo returned no results. Restart npm run dev so the search proxy is active.',
    )
  }
  return unique
}

interface BraveWebSearchResponse {
  web?: {
    results?: Array<{
      title?: string
      url?: string
      description?: string
    }>
  }
}

function clip(text: string, max = SNIPPET_CHARS): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

export function formatWebSearchForPrompt(hits: WebSearchHit[]): string {
  if (!hits.length) return ''
  const lines = hits.map(
    (hit, i) => `${i + 1}. ${hit.title}\n   ${hit.url}\n   ${hit.snippet}`,
  )
  return [
    '[Web search results — use these for current facts; cite titles/URLs when relevant]',
    ...lines,
  ].join('\n')
}

async function searchWikipedia(query: string, signal?: AbortSignal): Promise<WebSearchHit[]> {
  const url = new URL('https://en.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', query)
  url.searchParams.set('gsrlimit', String(MAX_HITS))
  url.searchParams.set('prop', 'extracts|info')
  url.searchParams.set('exintro', '1')
  url.searchParams.set('explaintext', '1')
  url.searchParams.set('exchars', String(SNIPPET_CHARS))
  url.searchParams.set('inprop', 'url')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) {
    throw new Error(`Wikipedia search failed (${res.status})`)
  }

  const data = (await res.json()) as WikipediaQueryResponse
  const pages = Object.values(data.query?.pages ?? {})
  return pages
    .map((page) => ({
      title: page.title ?? 'Untitled',
      url: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title ?? '')}`,
      snippet: clip(page.extract ?? ''),
    }))
    .filter((hit) => hit.snippet)
}

async function searchBrave(
  query: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<WebSearchHit[]> {
  const key = apiKey.trim()
  if (!key) {
    throw new Error('Add a Brave Search API key in Settings to use web search.')
  }

  const params = new URLSearchParams({
    q: query,
    count: String(MAX_HITS),
  })
  const res = await fetch(`/brave-search?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': key,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Brave search failed (${res.status})`)
  }

  const data = (await res.json()) as BraveWebSearchResponse
  return (data.web?.results ?? [])
    .slice(0, MAX_HITS)
    .map((item) => ({
      title: item.title ?? 'Untitled',
      url: item.url ?? '',
      snippet: clip(item.description ?? ''),
    }))
    .filter((hit) => hit.url)
}

export async function searchWeb(
  query: string,
  settings: AppSettings,
  signal?: AbortSignal,
): Promise<WebSearchHit[]> {
  const q = query.trim()
  if (!q) return []

  if (settings.webSearchProvider === 'brave') {
    return searchBrave(q, settings.webSearchApiKey, signal)
  }

  if (settings.webSearchProvider === 'wikipedia') {
    return searchWikipedia(q, signal)
  }

  return searchDuckDuckGo(q, signal)
}

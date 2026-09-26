/** Clean LLM output before passing to Mermaid. */
export function normalizeMermaidChart(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:mermaid)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
  if (/^mermaid\s*\n/i.test(s)) {
    s = s.replace(/^mermaid\s*\n/i, '')
  }
  return s.trim()
}

export function mermaidErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim().slice(0, 240)
  }
  return 'Could not render diagram'
}

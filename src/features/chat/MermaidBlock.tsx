import mermaid from 'mermaid'
import { useEffect, useId, useRef, useState } from 'react'
import { useResolvedTheme } from '@/hooks/useTheme'
import { mermaidErrorMessage, normalizeMermaidChart } from './mermaidUtils'

interface MermaidBlockProps {
  chart: string
}

let configuredTheme: 'light' | 'dark' | null = null

function ensureMermaid(theme: 'light' | 'dark') {
  if (configuredTheme === theme) return
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'default',
    securityLevel: 'antiscript',
  })
  configuredTheme = theme
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reactId = useId().replace(/:/g, '')
  const resolvedTheme = useResolvedTheme()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const source = normalizeMermaidChart(chart)
    if (!source) {
      setError('Empty diagram')
      return
    }

    let cancelled = false
    const host = containerRef.current
    if (!host) return

    void (async () => {
      try {
        setError(null)
        host.replaceChildren()
        host.removeAttribute('data-processed')

        ensureMermaid(resolvedTheme)
        if (cancelled) return

        const node = document.createElement('pre')
        node.className = 'mermaid'
        node.id = `dusk-mermaid-${reactId}`
        node.textContent = source
        host.appendChild(node)

        await mermaid.run({ nodes: [node] })
      } catch (err) {
        if (!cancelled) setError(mermaidErrorMessage(err))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [chart, reactId, resolvedTheme])

  if (error) {
    return (
      <div className="my-3 space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <p>{error}</p>
        <p className="text-xs text-muted-foreground">
          Check the diagram syntax in the Mermaid block (flowchart, sequenceDiagram,
          etc.).
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-3 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 [&_.mermaid]:mx-auto"
      aria-label="Mermaid diagram"
    />
  )
}

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ThemeMode } from '@/types'
import hljsDarkUrl from 'highlight.js/styles/github-dark.css?url'
import hljsLightUrl from 'highlight.js/styles/github.css?url'

const HLJS_LINK_ID = 'hljs-theme'

function applyHighlightJsTheme(resolved: 'light' | 'dark') {
  let link = document.getElementById(HLJS_LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = HLJS_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = resolved === 'dark' ? hljsDarkUrl : hljsLightUrl
}

export function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return theme
}

/** Resolved light/dark for UI that must react to Settings theme + system preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.settings.theme)
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveTheme(theme))

  useEffect(() => {
    const apply = () => setResolved(resolveTheme(theme))
    apply()
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  return resolved
}

export function useTheme() {
  const theme = useSettingsStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const resolved = resolveTheme(theme)
      root.classList.toggle('dark', resolved === 'dark')
      root.style.colorScheme = resolved
      applyHighlightJsTheme(resolved)
    }

    apply()

    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
}

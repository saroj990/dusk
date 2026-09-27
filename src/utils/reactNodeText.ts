import { isValidElement, type ReactNode } from 'react'

/** Flatten React children to plain text (e.g. Shiki-highlighted code spans). */
export function reactNodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(reactNodeText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return reactNodeText(node.props.children)
  }
  return ''
}

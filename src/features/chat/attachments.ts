import type { Attachment, Message, ProviderMessage } from '@/types'
import { createId, formatBytes } from '@/utils/cn'

export const ATTACHMENT_CONSTRAINTS = {
  maxFiles: 5,
  maxTextBytes: 256 * 1024,
  maxImageBytes: 4 * 1024 * 1024,
  maxTextChars: 80_000,
} as const

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'log',
  'json',
  'csv',
  'tsv',
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'py',
  'rs',
  'go',
  'java',
  'kt',
  'c',
  'cc',
  'cpp',
  'h',
  'hpp',
  'cs',
  'css',
  'scss',
  'html',
  'htm',
  'xml',
  'yaml',
  'yml',
  'toml',
  'ini',
  'env',
  'sh',
  'bash',
  'zsh',
  'sql',
  'r',
  'rb',
  'php',
  'swift',
])

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? (parts.pop() ?? '') : ''
}

export function describeAttachmentLimits(): string {
  return `Up to ${ATTACHMENT_CONSTRAINTS.maxFiles} files · text ≤ ${formatBytes(ATTACHMENT_CONSTRAINTS.maxTextBytes)} · images ≤ ${formatBytes(ATTACHMENT_CONSTRAINTS.maxImageBytes)}`
}

export function isAllowedAttachmentFile(file: File): { ok: true } | { ok: false; reason: string } {
  const ext = extensionOf(file.name)
  const isText =
    TEXT_EXTENSIONS.has(ext) ||
    file.type.startsWith('text/') ||
    file.type === 'application/json'
  const isImage =
    IMAGE_EXTENSIONS.has(ext) || file.type.startsWith('image/')

  if (!isText && !isImage) {
    return {
      ok: false,
      reason: `"${file.name}" is not a supported type (text or image).`,
    }
  }

  if (isImage && file.size > ATTACHMENT_CONSTRAINTS.maxImageBytes) {
    return {
      ok: false,
      reason: `"${file.name}" exceeds image limit (${formatBytes(ATTACHMENT_CONSTRAINTS.maxImageBytes)}).`,
    }
  }

  if (isText && !isImage && file.size > ATTACHMENT_CONSTRAINTS.maxTextBytes) {
    return {
      ok: false,
      reason: `"${file.name}" exceeds text limit (${formatBytes(ATTACHMENT_CONSTRAINTS.maxTextBytes)}).`,
    }
  }

  return { ok: true }
}

async function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function stripDataUrlPrefix(dataUrl: string): string {
  const idx = dataUrl.indexOf(',')
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl
}

export async function fileToAttachment(file: File): Promise<Attachment> {
  const check = isAllowedAttachmentFile(file)
  if (!check.ok) throw new Error(check.reason)

  const ext = extensionOf(file.name)
  const isImage =
    IMAGE_EXTENSIONS.has(ext) || file.type.startsWith('image/')

  if (isImage) {
    const dataUrl = await readAsDataUrl(file)
    return {
      id: createId(),
      name: file.name,
      mimeType: file.type || `image/${ext || 'png'}`,
      kind: 'image',
      size: file.size,
      base64: stripDataUrlPrefix(dataUrl),
    }
  }

  let text = await file.text()
  let truncated = false
  if (text.length > ATTACHMENT_CONSTRAINTS.maxTextChars) {
    text = `${text.slice(0, ATTACHMENT_CONSTRAINTS.maxTextChars)}\n\n…[truncated to ${ATTACHMENT_CONSTRAINTS.maxTextChars.toLocaleString()} characters]`
    truncated = true
  }

  return {
    id: createId(),
    name: file.name,
    mimeType: file.type || 'text/plain',
    kind: 'text',
    size: file.size,
    text: truncated ? text : text,
  }
}

export async function filesToAttachments(
  files: FileList | File[],
  existingCount: number,
): Promise<{ attachments: Attachment[]; errors: string[] }> {
  const list = Array.from(files)
  const errors: string[] = []
  const attachments: Attachment[] = []
  const remaining = ATTACHMENT_CONSTRAINTS.maxFiles - existingCount

  if (remaining <= 0) {
    return {
      attachments: [],
      errors: [`Maximum ${ATTACHMENT_CONSTRAINTS.maxFiles} attachments per message.`],
    }
  }

  for (const file of list.slice(0, remaining)) {
    try {
      attachments.push(await fileToAttachment(file))
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Failed to read ${file.name}`)
    }
  }

  if (list.length > remaining) {
    errors.push(
      `Only ${remaining} more file(s) allowed (max ${ATTACHMENT_CONSTRAINTS.maxFiles}).`,
    )
  }

  return { attachments, errors }
}

/** Build provider-facing content + images from a stored message. */
export function messageToProviderMessage(message: Message): ProviderMessage {
  let content = message.content
  const attachments = message.attachments ?? []

  for (const file of attachments) {
    if (file.kind === 'text' && file.text) {
      content = `${content}\n\n[Attached file: ${file.name}]\n\`\`\`\n${file.text}\n\`\`\``
    }
  }

  const images = attachments
    .filter((a) => a.kind === 'image' && a.base64)
    .map((a) => a.base64 as string)

  return {
    role: message.role,
    content: content.trim() || (images.length ? '(see attached image)' : ''),
    images: images.length ? images : undefined,
  }
}

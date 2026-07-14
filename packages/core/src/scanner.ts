import type { DeclaredCookie } from './types'

export interface ScanResult {
  declared: string[]
  undeclared: string[]
}

export function parseCookieNames(): string[] {
  if (typeof document === 'undefined') return []
  return document.cookie
    .split(';')
    .map(c => c.trim().split('=')[0].trim())
    .filter(Boolean)
}

export function scanCookies(declared: DeclaredCookie[]): ScanResult {
  const present = parseCookieNames()
  const declaredNames = new Set(declared.map(d => d.name))

  return {
    declared: present.filter(name => declaredNames.has(name)),
    undeclared: present.filter(name => !declaredNames.has(name)),
  }
}

/**
 * Polls document.cookie every 3 seconds and fires onUndeclared when cookies
 * are present that aren't in the declared list. Returns a cleanup function.
 */
export function runScanner(
  declared: DeclaredCookie[],
  onUndeclared: (names: string[]) => void,
): () => void {
  let lastSnapshot = ''

  const check = () => {
    const current = document.cookie
    if (current === lastSnapshot) return
    lastSnapshot = current

    const { undeclared } = scanCookies(declared)
    if (undeclared.length > 0) onUndeclared(undeclared)
  }

  check()
  const interval = setInterval(check, 3000)
  return () => clearInterval(interval)
}

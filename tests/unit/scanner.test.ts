import { describe, it, expect, beforeEach, vi } from 'vitest'
import { parseCookieNames, scanCookies } from '../../src/runtime/scanner'
import type { DeclaredCookie } from '../../src/runtime/types'

function setCookies(raw: string) {
  vi.stubGlobal('document', { cookie: raw })
}

beforeEach(() => {
  setCookies('')
})

describe('parseCookieNames', () => {
  it('parses names from a standard cookie string', () => {
    setCookies('_ga=GA1.1.1; _gid=GA1.1.2; session=abc123')
    expect(parseCookieNames()).toEqual(['_ga', '_gid', 'session'])
  })

  it('handles cookies with spaces around the semicolon', () => {
    setCookies('  foo=1 ; bar=2  ')
    expect(parseCookieNames()).toEqual(['foo', 'bar'])
  })

  it('returns an empty array for an empty cookie string', () => {
    setCookies('')
    expect(parseCookieNames()).toEqual([])
  })
})

describe('scanCookies', () => {
  beforeEach(() => {
    setCookies('_ga=1; _fbp=2; session=abc')
  })

  it('correctly separates declared and undeclared cookies', () => {
    const declared: DeclaredCookie[] = [
      { name: '_ga', category: 'analytics' },
      { name: 'session', category: 'necessary' },
    ]
    const result = scanCookies(declared)
    expect(result.declared).toEqual(expect.arrayContaining(['_ga', 'session']))
    expect(result.undeclared).toEqual(['_fbp'])
  })

  it('flags all cookies as undeclared when declared list is empty', () => {
    const result = scanCookies([])
    expect(result.declared).toEqual([])
    expect(result.undeclared).toEqual(expect.arrayContaining(['_ga', '_fbp', 'session']))
  })

  it('flags nothing as undeclared when all cookies are declared', () => {
    const declared: DeclaredCookie[] = [
      { name: '_ga', category: 'analytics' },
      { name: '_fbp', category: 'marketing' },
      { name: 'session', category: 'necessary' },
    ]
    const result = scanCookies(declared)
    expect(result.undeclared).toEqual([])
  })
})

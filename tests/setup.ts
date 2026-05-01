import { vi } from 'vitest'
import { ref } from 'vue'
import type { CategoryConfig } from '../src/runtime/types'

export const defaultCategories: CategoryConfig[] = [
  { key: 'necessary', label: 'Necessary', description: 'Required cookies', required: true },
  { key: 'analytics', label: 'Analytics', description: 'Analytics cookies', required: false },
  { key: 'functional', label: 'Functional', description: 'Functional cookies', required: false },
  { key: 'marketing', label: 'Marketing', description: 'Marketing cookies', required: false },
]

// Shared reactive state — components and tests observe the same refs
export const mockState = {
  decided: ref(false),
  preferences: ref<Record<string, boolean>>(
    Object.fromEntries(defaultCategories.map(c => [c.key, c.required ?? false])),
  ),
  record: ref(null),
  showBanner: ref(true),
  showModal: ref(false),
}

// Stable spy references — created once so the component's handlers
// and the test's expect() calls point at the same vi.fn() objects.
export const mockActions = {
  hydrate: vi.fn(),
  acceptAll: vi.fn(),
  rejectAll: vi.fn(),
  saveConsent: vi.fn(),
  openModal: vi.fn(),
  closeModal: vi.fn(),
}

vi.mock('../src/runtime/composables/useCookieConsent', () => ({
  useCookieConsent: () => ({
    ...mockState,
    categories: defaultCategories,
    ...mockActions,
    isEnabled: (key: string) => mockState.preferences.value[key] ?? false,
  }),
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      qookie: {
        storageKey: 'qookie:consent',
        privacyPolicyPath: '/privacy-policy',
        categories: defaultCategories,
        declaredCookies: [],
        auditEndpoint: undefined,
      },
    },
  }),
  useRoute: () => ({ path: '/' }),
  useState: vi.fn(),
  defineNuxtPlugin: (fn: () => unknown) => fn,
}))

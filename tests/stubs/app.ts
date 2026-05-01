// Stub for Nuxt's #app path alias.
// In tests this whole module is replaced by vi.mock('#app') in setup.ts.
export const useState = () => {}
export const useRuntimeConfig = () => ({})
export const useRoute = () => ({ path: '/' })
export const defineNuxtPlugin = (fn: () => unknown) => fn

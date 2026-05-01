import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../src/module'],

  qookie: {
    storageKey: 'qookie:consent',
    privacyPolicyPath: '/privacy-policy',
    declaredCookies: [
      { name: '_ga', category: 'analytics', description: 'Google Analytics' },
      { name: '_gid', category: 'analytics', description: 'Google Analytics session' },
      { name: 'session', category: 'necessary', description: 'Session identifier' },
    ],
  },
})

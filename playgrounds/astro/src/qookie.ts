import { createQookie } from '@qookie-consent/vue'

// Created once (ES module singleton) and shared across every island via _app.ts.
// autoBootstrap is off — <QookieBanner> runs hydrate + scanner on mount, which
// keeps state in sync with the server-rendered markup.
export const qookie = createQookie({
  privacyPolicyPath: '/privacy-policy',
  debug: true,
  declaredCookies: [
    { name: '_ga', category: 'analytics', description: 'Google Analytics' },
    { name: 'session', category: 'necessary', description: 'Session identifier' },
  ],
  autoBootstrap: false,
})

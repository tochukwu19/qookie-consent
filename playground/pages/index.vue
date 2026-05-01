<template>
  <div style="padding: 2rem; font-family: system-ui; max-width: 640px; margin: 0 auto;">
    <h1>Qookie Playground</h1>

    <section style="margin-top: 1.5rem;">
      <h2>State</h2>
      <p><strong>Decided:</strong> {{ decided }}</p>
      <p><strong>Preferences:</strong> <code>{{ JSON.stringify(preferences) }}</code></p>
      <p><strong>Record ID:</strong> {{ record?.id ?? '—' }}</p>
      <p><strong>Record timestamp:</strong> {{ record?.timestamp ?? '—' }}</p>
      <p><strong>Config hash:</strong> {{ record?.configHash ?? '—' }}</p>
    </section>

    <section style="margin-top: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
      <button @click="openModal">Open preferences</button>
      <button @click="acceptAll">Accept all</button>
      <button @click="rejectAll">Reject all</button>
    </section>

    <section style="margin-top: 1.5rem;">
      <NuxtLink to="/privacy-policy">Go to Privacy Policy page (banner hidden there)</NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
const { decided, preferences, record, openModal, acceptAll, rejectAll } = useCookieConsent()
</script>

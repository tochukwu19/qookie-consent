<template>
  <div class="status">
    <h2>Live consent state</h2>
    <p>
      This is a <strong>separate island</strong> from the banner. It reads the same
      shared store, so it updates the moment you accept or reject.
    </p>
    <p class="decided">Decided: <strong>{{ decided ? 'yes' : 'no' }}</strong></p>
    <ul>
      <li v-for="cat in categories" :key="cat.key">
        {{ cat.label }}:
        <span :class="isEnabled(cat.key) ? 'on' : 'off'">
          {{ isEnabled(cat.key) ? 'enabled' : 'disabled' }}
        </span>
      </li>
    </ul>
    <button class="reset" @click="reset">Reset consent</button>
  </div>
</template>

<script setup lang="ts">
import { useCookieConsent } from '@qookie/vue'

const store = useCookieConsent()
const { decided, categories, isEnabled } = store

function reset() {
  localStorage.removeItem(store.config.storageKey)
  location.reload()
}
</script>

<style scoped>
.status {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  max-width: 460px;
  background: #f9fafb;
}
h2 { margin-top: 0; font-size: 1.05rem; }
ul { padding-left: 1.1rem; }
.on { color: var(--qookie-accent); font-weight: 600; }
.off { color: #9ca3af; }
.reset {
  margin-top: 0.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
</style>

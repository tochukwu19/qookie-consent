<template>
  <Teleport to="body">
    <div class="qookie-overlay" @click.self="$emit('close')">
      <div
        class="qookie-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
      >
        <div class="qookie-modal__header">
          <h2 class="qookie-modal__title">{{ modalLabels.title ?? 'Cookie Preferences' }}</h2>
          <button class="qookie-modal__close" :aria-label="modalLabels.close ?? 'Close'" @click="$emit('close')">
            ✕
          </button>
        </div>

        <div class="qookie-modal__body">
          <div
            v-for="cat in categories"
            :key="cat.key"
            class="qookie-modal__row"
          >
            <div class="qookie-modal__info">
              <span class="qookie-modal__label">{{ cat.label }}</span>
              <p class="qookie-modal__desc">{{ cat.description }}</p>
            </div>

            <button
              class="qookie-modal__toggle"
              :class="{ 'qookie-modal__toggle--on': draft[cat.key] }"
              :disabled="cat.required"
              :aria-pressed="!!draft[cat.key]"
              :aria-label="`${cat.label} cookies ${draft[cat.key] ? 'enabled' : 'disabled'}`"
              @click="toggle(cat.key)"
            >
              <span class="qookie-modal__thumb" />
            </button>
          </div>
        </div>

        <div class="qookie-modal__footer">
          <button class="qookie-modal__btn qookie-modal__btn--ghost" @click="handleRejectAll">
            {{ modalLabels.rejectAll ?? 'Reject all' }}
          </button>
          <button class="qookie-modal__btn qookie-modal__btn--solid" @click="handleSave">
            {{ modalLabels.savePreferences ?? 'Save preferences' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, type Ref } from 'vue'
import type { ConsentPreferences, QookieLabels } from '@qookie-consent/core'
import { useCookieConsent } from '../useCookieConsent'

defineEmits<{ close: [] }>()

const store = useCookieConsent()
const { categories, saveConsent, rejectAll } = store
// The store's refs are real Vue refs at runtime; core types them structurally
// (`{ value: T }`), so cast to Vue's Ref for correct watch/unwrap typing.
const preferences = store.preferences as Ref<ConsentPreferences>
const modalLabels = ((store.config.labels as QookieLabels)?.modal) ?? {}

const draft = ref<ConsentPreferences>({ ...preferences.value })

watch(preferences, val => { draft.value = { ...val } }, { immediate: true })

function toggle(key: string) {
  const cat = categories.find(c => c.key === key)
  if (cat?.required) return
  draft.value = { ...draft.value, [key]: !draft.value[key] }
}

function handleSave() {
  saveConsent({ ...draft.value })
}

function handleRejectAll() {
  rejectAll()
}
</script>

<style scoped>
.qookie-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.qookie-modal {
  background: var(--qookie-bg, #ffffff);
  border-radius: calc(var(--qookie-radius, 6px) * 2);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--qookie-font, 'Poppins', sans-serif);
}

.qookie-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--qookie-border, #e5e7eb);
  flex-shrink: 0;
}

.qookie-modal__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--qookie-text, #111827);
}

.qookie-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  color: var(--qookie-muted, #6b7280);
  padding: 0.25rem;
}

.qookie-modal__body {
  overflow-y: auto;
  flex: 1;
}

.qookie-modal__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--qookie-border, #f3f4f6);
}

.qookie-modal__row:last-child {
  border-bottom: none;
}

.qookie-modal__info {
  flex: 1;
}

.qookie-modal__label {
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--qookie-text, #111827);
  margin-bottom: 0.25rem;
}

.qookie-modal__desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--qookie-muted, #6b7280);
}

/* Toggle switch */
.qookie-modal__toggle {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--qookie-border, #d1d5db);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
}

.qookie-modal__toggle--on {
  background: var(--qookie-accent, #226845);
}

.qookie-modal__toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qookie-modal__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
  display: block;
  pointer-events: none;
}

.qookie-modal__toggle--on .qookie-modal__thumb {
  transform: translateX(20px);
}

.qookie-modal__footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--qookie-border, #e5e7eb);
  flex-shrink: 0;
}

.qookie-modal__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.25rem;
  border-radius: var(--qookie-radius, 6px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--qookie-border, #d1d5db);
  transition: opacity 0.15s;
}

.qookie-modal__btn:hover {
  opacity: 0.85;
}

.qookie-modal__btn--ghost {
  background: transparent;
  color: var(--qookie-text, #374151);
}

.qookie-modal__btn--solid {
  background: var(--qookie-accent, #226845);
  color: var(--qookie-accent-fg, #ffffff);
  border-color: var(--qookie-accent, #226845);
}
</style>

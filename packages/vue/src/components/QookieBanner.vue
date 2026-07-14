<template>
  <Transition name="qookie-slide">
    <div
      v-if="showBanner && !isPrivacyPage"
      class="qookie-banner"
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="true"
    >
      <div class="qookie-banner__inner">
        <p class="qookie-banner__text">
          <slot name="message">
            {{ bannerLabels.message ?? 'We use cookies to improve your experience.' }}
            <a :href="privacyPolicyPath" class="qookie-banner__link">
              {{ bannerLabels.learnMore ?? 'Learn more' }}
            </a>
          </slot>
        </p>

        <div class="qookie-banner__actions">
          <!-- Reject and Accept are identical in size — compliance requirement -->
          <button class="qookie-banner__btn qookie-banner__btn--ghost" @click="rejectAll">
            {{ bannerLabels.rejectAll ?? 'Reject all' }}
          </button>
          <button class="qookie-banner__btn qookie-banner__btn--ghost" @click="openModal">
            {{ bannerLabels.manage ?? 'Manage' }}
          </button>
          <button class="qookie-banner__btn qookie-banner__btn--solid" @click="acceptAll">
            {{ bannerLabels.acceptAll ?? 'Accept all' }}
          </button>
        </div>
      </div>

      <QookieModal v-if="showModal" @close="closeModal" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import type { QookieLabels } from '@qookie-consent/core'
import { useCookieConsent } from '../useCookieConsent'
import { bootstrapStore } from '../context'
import QookieModal from './QookieModal.vue'

const props = withDefaults(
  defineProps<{
    /** Current route path; falls back to window.location.pathname. */
    currentPath?: string
    /** Run hydrate + scanner on mount. Set false when a host (e.g. Nuxt) bootstraps. */
    bootstrap?: boolean
  }>(),
  { bootstrap: true },
)

const store = useCookieConsent()
const { showBanner, showModal, acceptAll, rejectAll, openModal, closeModal } = store
const privacyPolicyPath = store.config.privacyPolicyPath ?? '/privacy-policy'
const bannerLabels = ((store.config.labels as QookieLabels)?.banner) ?? {}

const detectedPath = ref(typeof window !== 'undefined' ? window.location.pathname : '/')
const activePath = computed(() => props.currentPath ?? detectedPath.value)
const isPrivacyPage = computed(() => activePath.value === privacyPolicyPath)

function syncPath() {
  detectedPath.value = window.location.pathname
}

onMounted(() => {
  if (props.bootstrap) bootstrapStore(store)
  window.addEventListener('popstate', syncPath)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncPath)
})
</script>

<style scoped>
.qookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: var(--qookie-bg, #ffffff);
  border-top: 1px solid var(--qookie-border, #e5e7eb);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.06);
  font-family: var(--qookie-font, 'Poppins', sans-serif);
}

.qookie-banner__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.qookie-banner__text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--qookie-text, #374151);
  flex: 1;
  min-width: 200px;
}

.qookie-banner__link {
  color: var(--qookie-accent, #226845);
  text-decoration: underline;
}

.qookie-banner__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* Both variants share the same dimensions — equal visual weight is a compliance requirement */
.qookie-banner__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  padding: 0.5rem 1.25rem;
  border-radius: var(--qookie-radius, 6px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--qookie-border, #d1d5db);
  transition: opacity 0.15s;
  white-space: nowrap;
}

.qookie-banner__btn:hover {
  opacity: 0.85;
}

.qookie-banner__btn--ghost {
  background: transparent;
  color: var(--qookie-text, #374151);
}

.qookie-banner__btn--solid {
  background: var(--qookie-accent, #226845);
  color: var(--qookie-accent-fg, #ffffff);
  border-color: var(--qookie-accent, #226845);
}

.qookie-slide-enter-active,
.qookie-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.qookie-slide-enter-from,
.qookie-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>

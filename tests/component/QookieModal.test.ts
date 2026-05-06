import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockState, mockActions, mockQookieConfig, defaultCategories } from '../setup'
import QookieModal from '../../src/runtime/components/QookieModal.vue'

const mountModal = () =>
  mount(QookieModal, {
    global: { stubs: { Teleport: true } },
    attachTo: document.body,
  })

beforeEach(() => {
  mockState.showModal.value = true
  mockState.preferences.value = {
    necessary: true,
    analytics: false,
    functional: false,
    marketing: false,
  }
  mockQookieConfig.labels = {}
  vi.clearAllMocks()
})

describe('QookieModal', () => {
  it('renders a row for each category', () => {
    expect(mountModal().findAll('.qookie-modal__row')).toHaveLength(defaultCategories.length)
  })

  it('the necessary category toggle is disabled', () => {
    const wrapper = mountModal()
    expect(wrapper.findAll('.qookie-modal__toggle').at(0)!.attributes('disabled')).toBeDefined()
  })

  it('non-required toggles are not disabled', () => {
    const wrapper = mountModal()
    const toggles = wrapper.findAll('.qookie-modal__toggle')
    for (let i = 1; i < toggles.length; i++) {
      expect(toggles.at(i)!.attributes('disabled')).toBeUndefined()
    }
  })

  it('clicking a non-required toggle flips its visual state', async () => {
    const wrapper = mountModal()
    const toggle = () => wrapper.findAll('.qookie-modal__toggle').at(1)!
    expect(toggle().classes()).not.toContain('qookie-modal__toggle--on')
    await toggle().trigger('click')
    await flushPromises()
    expect(toggle().classes()).toContain('qookie-modal__toggle--on')
  })

  it('clicking a required toggle does not change its state', async () => {
    const wrapper = mountModal()
    const necessaryToggle = wrapper.findAll('.qookie-modal__toggle').at(0)!
    const before = necessaryToggle.classes().includes('qookie-modal__toggle--on')
    await necessaryToggle.trigger('click')
    expect(necessaryToggle.classes().includes('qookie-modal__toggle--on')).toBe(before)
  })

  it('Save preferences calls saveConsent with the draft', async () => {
    const wrapper = mountModal()
    await wrapper.findAll('.qookie-modal__toggle').at(1)!.trigger('click')
    await wrapper.find('.qookie-modal__btn--solid').trigger('click')
    expect(mockActions.saveConsent).toHaveBeenCalledWith(
      expect.objectContaining({ analytics: true }),
    )
  })

  it('Reject all calls rejectAll', async () => {
    const wrapper = mountModal()
    await wrapper.find('.qookie-modal__btn--ghost').trigger('click')
    expect(mockActions.rejectAll).toHaveBeenCalledOnce()
  })

  it('close button emits the close event', async () => {
    const wrapper = mountModal()
    await wrapper.find('.qookie-modal__close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('clicking the overlay backdrop emits close', async () => {
    const wrapper = mountModal()
    await wrapper.find('.qookie-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('each toggle has an accessible aria-pressed attribute', () => {
    mountModal().findAll('.qookie-modal__toggle').forEach(t => {
      expect(['true', 'false']).toContain(t.attributes('aria-pressed'))
    })
  })

  it('each toggle has an aria-label', () => {
    mountModal().findAll('.qookie-modal__toggle').forEach(t => {
      expect(t.attributes('aria-label')).toBeTruthy()
    })
  })
})

describe('QookieModal — default labels', () => {
  it('renders the default modal title', () => {
    expect(mountModal().find('.qookie-modal__title').text()).toBe('Cookie Preferences')
  })

  it('renders the default Save preferences label', () => {
    expect(mountModal().find('.qookie-modal__btn--solid').text()).toBe('Save preferences')
  })

  it('renders the default Reject all label', () => {
    expect(mountModal().find('.qookie-modal__btn--ghost').text()).toBe('Reject all')
  })

  it('close button has the default aria-label', () => {
    expect(mountModal().find('.qookie-modal__close').attributes('aria-label')).toBe('Close')
  })
})

describe('QookieModal — custom labels', () => {
  it('renders a custom modal title', () => {
    mockQookieConfig.labels = { modal: { title: 'Préférences de cookies' } }
    expect(mountModal().find('.qookie-modal__title').text()).toBe('Préférences de cookies')
  })

  it('renders a custom Save preferences label', () => {
    mockQookieConfig.labels = { modal: { savePreferences: 'Sauvegarder' } }
    expect(mountModal().find('.qookie-modal__btn--solid').text()).toBe('Sauvegarder')
  })

  it('renders a custom Reject all label', () => {
    mockQookieConfig.labels = { modal: { rejectAll: 'Tout refuser' } }
    expect(mountModal().find('.qookie-modal__btn--ghost').text()).toBe('Tout refuser')
  })

  it('renders a custom close aria-label', () => {
    mockQookieConfig.labels = { modal: { close: 'Fermer' } }
    expect(mountModal().find('.qookie-modal__close').attributes('aria-label')).toBe('Fermer')
  })
})

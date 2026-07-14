import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createQookie, defaultCategories } from '../src/createQookie'
import { _resetStore } from '../src/context'
import type { QookieOptions } from '../src/createQookie'
import type { ConsentStore } from '@qookie-consent/core'
import QookieBanner from '../src/components/QookieBanner.vue'

const modalStub = { template: '<div data-testid="modal-stub" />' }

function setupStore(opts: QookieOptions = {}): ConsentStore {
  _resetStore()
  localStorage.clear()
  const { store } = createQookie({ categories: defaultCategories, autoBootstrap: false, ...opts })
  store.showBanner.value = true
  store.showModal.value = false
  store.preferences.value = { necessary: true, analytics: false, functional: false, marketing: false }
  return store
}

const mountBanner = (mountOptions = {}) =>
  mount(QookieBanner, {
    props: { bootstrap: false },
    global: {
      stubs: { Teleport: true, Transition: false, QookieModal: modalStub },
    },
    ...mountOptions,
  })

let store: ConsentStore

beforeEach(() => {
  store = setupStore()
  vi.clearAllMocks()
})

describe('QookieBanner', () => {
  it('renders when showBanner is true', () => {
    expect(mountBanner().find('.qookie-banner').exists()).toBe(true)
  })

  it('does not render when showBanner is false', () => {
    store.showBanner.value = false
    expect(mountBanner().find('.qookie-banner').exists()).toBe(false)
  })

  it('has three action buttons', () => {
    expect(mountBanner().findAll('.qookie-banner__btn')).toHaveLength(3)
  })

  it('Reject all and Accept all share the base class but differ by modifier (equal prominence)', () => {
    const [reject, , accept] = mountBanner().findAll('.qookie-banner__btn')
    expect(reject.classes()).toContain('qookie-banner__btn')
    expect(accept.classes()).toContain('qookie-banner__btn')
    const rejectMod = reject.classes().find(c => c.includes('--'))
    const acceptMod = accept.classes().find(c => c.includes('--'))
    expect(rejectMod).not.toBe(acceptMod)
  })

  it('calls acceptAll when Accept all is clicked', async () => {
    const spy = vi.spyOn(store, 'acceptAll')
    const wrapper = mountBanner()
    await wrapper.findAll('.qookie-banner__btn').at(2)!.trigger('click')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('calls rejectAll when Reject all is clicked', async () => {
    const spy = vi.spyOn(store, 'rejectAll')
    const wrapper = mountBanner()
    await wrapper.findAll('.qookie-banner__btn').at(0)!.trigger('click')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('calls openModal when Manage is clicked', async () => {
    const spy = vi.spyOn(store, 'openModal')
    const wrapper = mountBanner()
    await wrapper.findAll('.qookie-banner__btn').at(1)!.trigger('click')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('renders QookieModal when showModal is true', () => {
    store.showModal.value = true
    expect(mountBanner().find('[data-testid="modal-stub"]').exists()).toBe(true)
  })

  it('contains a link to the privacy policy', () => {
    const link = mountBanner().find('a.qookie-banner__link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/privacy-policy')
  })
})

describe('QookieBanner — default labels', () => {
  it('renders the default message text', () => {
    expect(mountBanner().text()).toContain('We use cookies to improve your experience.')
  })

  it('renders the default Learn more link text', () => {
    expect(mountBanner().find('a.qookie-banner__link').text()).toBe('Learn more')
  })

  it('renders the default button labels', () => {
    const [reject, manage, accept] = mountBanner().findAll('.qookie-banner__btn')
    expect(reject.text()).toBe('Reject all')
    expect(manage.text()).toBe('Manage')
    expect(accept.text()).toBe('Accept all')
  })
})

describe('QookieBanner — custom labels', () => {
  it('renders a custom banner message', () => {
    setupStore({ labels: { banner: { message: 'Nous utilisons des cookies.' } } })
    expect(mountBanner().text()).toContain('Nous utilisons des cookies.')
  })

  it('renders custom Learn more text', () => {
    setupStore({ labels: { banner: { learnMore: 'En savoir plus' } } })
    expect(mountBanner().find('a.qookie-banner__link').text()).toBe('En savoir plus')
  })

  it('renders custom button labels', () => {
    setupStore({ labels: { banner: { acceptAll: 'Tout accepter', rejectAll: 'Tout refuser', manage: 'Gérer' } } })
    const [reject, manage, accept] = mountBanner().findAll('.qookie-banner__btn')
    expect(reject.text()).toBe('Tout refuser')
    expect(manage.text()).toBe('Gérer')
    expect(accept.text()).toBe('Tout accepter')
  })
})

describe('QookieBanner — #message slot', () => {
  it('renders slot content instead of the default message', () => {
    const wrapper = mountBanner({ slots: { message: '<span data-testid="custom-msg">Custom message</span>' } })
    expect(wrapper.find('[data-testid="custom-msg"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="custom-msg"]').text()).toBe('Custom message')
  })

  it('slot content replaces the default message text', () => {
    const wrapper = mountBanner({ slots: { message: '<span>Wij gebruiken cookies.</span>' } })
    expect(wrapper.text()).not.toContain('We use cookies to improve your experience.')
    expect(wrapper.text()).toContain('Wij gebruiken cookies.')
  })
})

describe('QookieBanner — privacy page', () => {
  it('hides the banner when currentPath matches the privacy policy path', () => {
    const wrapper = mountBanner({ props: { bootstrap: false, currentPath: '/privacy-policy' } })
    expect(wrapper.find('.qookie-banner').exists()).toBe(false)
  })
})

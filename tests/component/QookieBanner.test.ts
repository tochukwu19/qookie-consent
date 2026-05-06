import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockState, mockActions, mockQookieConfig } from '../setup'
import QookieBanner from '../../src/runtime/components/QookieBanner.vue'

const modalStub = { template: '<div data-testid="modal-stub" />' }

const mountBanner = () =>
  mount(QookieBanner, {
    global: {
      stubs: { Teleport: true, Transition: false },
      components: { QookieModal: modalStub },
    },
  })

beforeEach(() => {
  mockState.showBanner.value = true
  mockState.showModal.value = false
  mockState.decided.value = false
  mockState.preferences.value = {
    necessary: true,
    analytics: false,
    functional: false,
    marketing: false,
  }
  mockQookieConfig.labels = {}
  vi.clearAllMocks()
})

describe('QookieBanner', () => {
  it('renders when showBanner is true', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('.qookie-banner').exists()).toBe(true)
  })

  it('does not render when showBanner is false', () => {
    mockState.showBanner.value = false
    const wrapper = mountBanner()
    expect(wrapper.find('.qookie-banner').exists()).toBe(false)
  })

  it('has three action buttons', () => {
    const wrapper = mountBanner()
    expect(wrapper.findAll('.qookie-banner__btn')).toHaveLength(3)
  })

  it('Reject all and Accept all buttons share the same base class (equal prominence)', () => {
    const wrapper = mountBanner()
    const [reject, , accept] = wrapper.findAll('.qookie-banner__btn')
    // Both must carry the base size class
    expect(reject.classes()).toContain('qookie-banner__btn')
    expect(accept.classes()).toContain('qookie-banner__btn')
    // They differ only in their modifier
    const rejectMod = reject.classes().find(c => c.includes('--'))
    const acceptMod = accept.classes().find(c => c.includes('--'))
    expect(rejectMod).not.toBe(acceptMod)
  })

  it('calls acceptAll when Accept all is clicked', async () => {
    const wrapper = mountBanner()
    await wrapper.findAll('.qookie-banner__btn').at(2)!.trigger('click')
    expect(mockActions.acceptAll).toHaveBeenCalledOnce()
  })

  it('calls rejectAll when Reject all is clicked', async () => {
    const wrapper = mountBanner()
    await wrapper.findAll('.qookie-banner__btn').at(0)!.trigger('click')
    expect(mockActions.rejectAll).toHaveBeenCalledOnce()
  })

  it('calls openModal when Manage is clicked', async () => {
    const wrapper = mountBanner()
    await wrapper.findAll('.qookie-banner__btn').at(1)!.trigger('click')
    expect(mockActions.openModal).toHaveBeenCalledOnce()
  })

  it('renders QookieModal stub when showModal is true', async () => {
    mockState.showModal.value = true
    const wrapper = mountBanner()
    expect(wrapper.find('[data-testid="modal-stub"]').exists()).toBe(true)
  })

  it('contains a link to the privacy policy', () => {
    const wrapper = mountBanner()
    const link = wrapper.find('a.qookie-banner__link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/privacy-policy')
  })
})

describe('QookieBanner — default labels', () => {
  it('renders the default message text', () => {
    const wrapper = mountBanner()
    expect(wrapper.text()).toContain('We use cookies to improve your experience.')
  })

  it('renders the default Learn more link text', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('a.qookie-banner__link').text()).toBe('Learn more')
  })

  it('renders the default button labels', () => {
    const wrapper = mountBanner()
    const [reject, manage, accept] = wrapper.findAll('.qookie-banner__btn')
    expect(reject.text()).toBe('Reject all')
    expect(manage.text()).toBe('Manage')
    expect(accept.text()).toBe('Accept all')
  })
})

describe('QookieBanner — custom labels', () => {
  it('renders a custom banner message', () => {
    mockQookieConfig.labels = { banner: { message: 'Nous utilisons des cookies.' } }
    const wrapper = mountBanner()
    expect(wrapper.text()).toContain('Nous utilisons des cookies.')
  })

  it('renders custom Learn more text', () => {
    mockQookieConfig.labels = { banner: { learnMore: 'En savoir plus' } }
    const wrapper = mountBanner()
    expect(wrapper.find('a.qookie-banner__link').text()).toBe('En savoir plus')
  })

  it('renders custom button labels', () => {
    mockQookieConfig.labels = {
      banner: { acceptAll: 'Tout accepter', rejectAll: 'Tout refuser', manage: 'Gérer' },
    }
    const wrapper = mountBanner()
    const [reject, manage, accept] = wrapper.findAll('.qookie-banner__btn')
    expect(reject.text()).toBe('Tout refuser')
    expect(manage.text()).toBe('Gérer')
    expect(accept.text()).toBe('Tout accepter')
  })
})

describe('QookieBanner — #message slot', () => {
  it('renders slot content instead of the default message', () => {
    const wrapper = mount(QookieBanner, {
      global: {
        stubs: { Teleport: true, Transition: false },
        components: { QookieModal: modalStub },
      },
      slots: {
        message: '<span data-testid="custom-msg">Custom message</span>',
      },
    })
    expect(wrapper.find('[data-testid="custom-msg"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="custom-msg"]').text()).toBe('Custom message')
  })

  it('slot content replaces the default message text', () => {
    const wrapper = mount(QookieBanner, {
      global: {
        stubs: { Teleport: true, Transition: false },
        components: { QookieModal: modalStub },
      },
      slots: {
        message: '<span>Wij gebruiken cookies.</span>',
      },
    })
    expect(wrapper.text()).not.toContain('We use cookies to improve your experience.')
    expect(wrapper.text()).toContain('Wij gebruiken cookies.')
  })
})

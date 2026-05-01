import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockState, mockActions } from '../setup'
import QookieBanner from '../../src/runtime/components/QookieBanner.vue'

const modalStub = { template: '<div data-testid="modal-stub" />' }

const mountBanner = () =>
  mount(QookieBanner, {
    global: {
      stubs: { Teleport: true, Transition: false },
      // Register the modal stub so QookieBanner can resolve <QookieModal>
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

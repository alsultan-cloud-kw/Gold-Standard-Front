// @vitest-environment jsdom
/// <reference types="vitest/globals" />

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('@/services/api', () => ({
  apiService: {
    get: getMock,
  },
}))

import {
  initializeMetaPixel,
  resetMetaPixelForTests,
  safeMetaSearchTerm,
  trackMetaEvent,
  trackMetaPurchaseOnce,
  type MetaPixelConfig,
} from './metaPixel'

const enabledEvents: MetaPixelConfig['events'] = {
  page_view: true,
  view_content: true,
  view_category: true,
  search: true,
  add_to_cart: true,
  initiate_checkout: true,
  add_payment_info: true,
  order_created: true,
  purchase: true,
  join_chat: true,
  lead: true,
}

function fbqQueue(): unknown[][] {
  return (window.fbq?.queue ?? []) as unknown[][]
}

beforeEach(() => {
  resetMetaPixelForTests()
  getMock.mockReset()
  localStorage.clear()
  document.getElementById('gs-meta-pixel-script')?.remove()
  delete window.fbq
  delete window._fbq
})

describe('Meta Pixel runtime', () => {
  it('loads the Hub-provided Pixel ID and sends events to that Pixel only', async () => {
    getMock.mockResolvedValue({
      enabled: true,
      pixel_id: '123456789012345',
      events: enabledEvents,
    })

    await initializeMetaPixel()
    trackMetaEvent('page_view', 'PageView', { page_path: '/products' })

    expect(getMock).toHaveBeenCalledWith('/accounts/website-pixel/')
    expect(document.getElementById('gs-meta-pixel-script')).not.toBeNull()
    expect(fbqQueue()).toContainEqual(['set', 'disablePushState', true])
    expect(fbqQueue()).toContainEqual(['init', '123456789012345'])
    expect(fbqQueue()).toContainEqual([
      'trackSingle',
      '123456789012345',
      'PageView',
      { page_path: '/products' },
    ])
  })

  it('injects no Meta script and sends no events while disabled', async () => {
    getMock.mockResolvedValue({
      enabled: false,
      pixel_id: '123456789012345',
      events: enabledEvents,
    })

    await initializeMetaPixel()
    trackMetaEvent('add_to_cart', 'AddToCart', { value: 12, currency: 'KWD' })

    expect(document.getElementById('gs-meta-pixel-script')).toBeNull()
    expect(window.fbq).toBeUndefined()
  })

  it('respects event toggles from Hub', async () => {
    getMock.mockResolvedValue({
      enabled: true,
      pixel_id: '123456789012345',
      events: { ...enabledEvents, search: false },
    })

    await initializeMetaPixel()
    trackMetaEvent('search', 'Search', { search_string: 'gold bar' })

    expect(fbqQueue().some((call) => call.includes('Search'))).toBe(false)
  })

  it('sends one paid Purchase per sale with a stable deduplication ID', async () => {
    getMock.mockResolvedValue({
      enabled: true,
      pixel_id: '123456789012345',
      events: enabledEvents,
    })
    await initializeMetaPixel()

    const first = trackMetaPurchaseOnce('sale-123', { value: 525.447, currency: 'KWD' })
    const duplicate = trackMetaPurchaseOnce('sale-123', { value: 525.447, currency: 'KWD' })

    expect(first).toBe(true)
    expect(duplicate).toBe(false)
    const purchases = fbqQueue().filter((call) => call.includes('Purchase'))
    expect(purchases).toEqual([
      [
        'trackSingle',
        '123456789012345',
        'Purchase',
        { value: 525.447, currency: 'KWD' },
        { eventID: 'purchase:sale-123' },
      ],
    ])
  })

  it('does not send likely email, phone, or Civil ID search values', () => {
    expect(safeMetaSearchTerm('gold bar 10g')).toBe('gold bar 10g')
    expect(safeMetaSearchTerm('customer@example.com')).toBeNull()
    expect(safeMetaSearchTerm('123456789012')).toBeNull()
  })
})

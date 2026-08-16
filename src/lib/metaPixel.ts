import type { Cart, Product } from '@/types'
import { apiService } from '@/services/api'

export const META_PIXEL_EVENT_KEYS = [
  'page_view',
  'view_content',
  'view_category',
  'search',
  'add_to_cart',
  'initiate_checkout',
  'add_payment_info',
  'order_created',
  'purchase',
  'join_chat',
  'lead',
] as const

export type MetaPixelEventKey = (typeof META_PIXEL_EVENT_KEYS)[number]

export type MetaPixelConfig = {
  enabled: boolean
  pixel_id: string
  events: Record<MetaPixelEventKey, boolean>
}

type MetaEventParams = Record<
  string,
  string | number | boolean | Array<string> | Array<Record<string, string | number>>
>

type QueuedEvent = {
  key: MetaPixelEventKey
  eventName: string
  params?: MetaEventParams
  eventId?: string
  custom?: boolean
}

type Fbq = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[][]
  push?: Fbq
  loaded?: boolean
  version?: string
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const SCRIPT_ID = 'gs-meta-pixel-script'
const PURCHASE_STORAGE_PREFIX = 'gs_meta_purchase_v1:'
const pendingEvents: QueuedEvent[] = []

let config: MetaPixelConfig | null = null
let configured = false
let activePixelId = ''
let initializationPromise: Promise<MetaPixelConfig | null> | null = null

function validPixelId(value: string): boolean {
  return /^\d{5,32}$/.test(value)
}

function installFbqStub(): Fbq {
  if (window.fbq) return window.fbq
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args)
      return
    }
    fbq.queue?.push(args)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  return fbq
}

function injectPixelScript(): void {
  if (document.getElementById(SCRIPT_ID)) return
  const firstScript = document.getElementsByTagName('script')[0]
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript)
  } else {
    document.head.appendChild(script)
  }
}

function dispatch(event: QueuedEvent): void {
  if (!config?.enabled || !config.events[event.key] || !window.fbq || !activePixelId) return
  const method = event.custom ? 'trackSingleCustom' : 'trackSingle'
  const args: unknown[] = [method, activePixelId, event.eventName]
  if (event.params || event.eventId) args.push(event.params ?? {})
  if (event.eventId) args.push({ eventID: event.eventId })
  window.fbq(...args)
}

function flushPendingEvents(): void {
  pendingEvents.splice(0).forEach(dispatch)
}

export function initializeMetaPixel(): Promise<MetaPixelConfig | null> {
  if (initializationPromise) return initializationPromise
  initializationPromise = (async () => {
    try {
      const loaded = await apiService.get<MetaPixelConfig>('/accounts/website-pixel/')
      configured = true
      config = loaded

      if (!loaded.enabled || !validPixelId(loaded.pixel_id)) {
        pendingEvents.splice(0)
        return loaded
      }

      const fbq = installFbqStub()
      injectPixelScript()
      if (activePixelId !== loaded.pixel_id) {
        // We own SPA route PageViews so Meta's History API listener must stay off.
        fbq('set', 'disablePushState', true)
        fbq('init', loaded.pixel_id)
        activePixelId = loaded.pixel_id
      }
      flushPendingEvents()
      return loaded
    } catch {
      configured = true
      config = null
      pendingEvents.splice(0)
      return null
    }
  })()
  return initializationPromise
}

export function newMetaEventId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}:${random}`
}

export function safeMetaSearchTerm(value: string): string | null {
  const term = value.replace(/\s+/g, ' ').trim().slice(0, 100)
  if (!term) return null
  // Search terms can be user-entered; never forward likely email, phone, or Civil ID values.
  if (term.includes('@') || /\d{7,}/.test(term)) return null
  return term
}

export function trackMetaEvent(
  key: MetaPixelEventKey,
  eventName: string,
  params?: MetaEventParams,
  options?: { eventId?: string; custom?: boolean },
): void {
  const event: QueuedEvent = {
    key,
    eventName,
    params,
    eventId: options?.eventId,
    custom: options?.custom,
  }
  if (!configured) {
    if (pendingEvents.length < 30) pendingEvents.push(event)
    return
  }
  dispatch(event)
}

export function productMetaParams(
  product: Product,
  quantity = 1,
  value?: number,
): MetaEventParams {
  const unitValue = Number(value ?? product.live_total_price ?? product.current_price ?? 0)
  return {
    content_ids: [product.id],
    content_name: product.name_en || product.name_ar,
    content_type: 'product',
    contents: [{ id: product.id, quantity, item_price: unitValue }],
    currency: 'KWD',
    value: Math.max(0, unitValue * quantity),
  }
}

export function cartMetaParams(cart: Cart, value?: number): MetaEventParams {
  const contents = cart.items.map((item) => ({
    id: item.product.id,
    quantity: item.quantity,
    item_price: Number(item.unit_price ?? item.product.live_total_price ?? 0),
  }))
  return {
    content_ids: cart.items.map((item) => item.product.id),
    content_type: 'product',
    contents,
    currency: 'KWD',
    num_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    value: Math.max(0, Number(value ?? cart.total_amount ?? cart.subtotal ?? 0)),
  }
}

export function trackMetaPurchaseOnce(
  saleId: string,
  params: MetaEventParams,
): boolean {
  if (!saleId) return false
  const marker = `${PURCHASE_STORAGE_PREFIX}${saleId}`
  try {
    if (localStorage.getItem(marker) === '1') return false
  } catch {
    /* private mode */
  }

  trackMetaEvent('purchase', 'Purchase', params, {
    eventId: `purchase:${saleId}`,
  })
  try {
    localStorage.setItem(marker, '1')
  } catch {
    /* private mode */
  }
  return true
}

export function resetMetaPixelForTests(): void {
  config = null
  configured = false
  activePixelId = ''
  initializationPromise = null
  pendingEvents.splice(0)
}

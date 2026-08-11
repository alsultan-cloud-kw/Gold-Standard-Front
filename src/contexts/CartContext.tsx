import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import i18n from '../i18n'
import type { Product, Cart, CartItem } from '../types'
import { productsApi, clubsApi, cartApi } from '../services/api'
import { useAuth } from './AuthContext'
import {
  cartUnitsForProductId,
  clampCartLineQuantity,
  clampPurchaseQuantity,
  isProductOutOfStock,
  isProductSerialized,
  maxPurchasableQuantity,
  productAvailableQuantity,
  productStockFieldsChanged,
} from '@/utils/productStock'

interface CartContextType {
  cart: Cart
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getItemCount: () => number
}

const defaultCart: Cart = {
  items: [],
  subtotal: 0,
  discount_amount: 0,
  tax_amount: 0,
  total_amount: 0,
  item_count: 0,
}

function productDisplayName(product: Product): string {
  const isAr = i18n.language?.startsWith('ar')
  if (isAr && product.name_ar?.trim()) return product.name_ar.trim()
  return product.name_en?.trim() || product.name_ar?.trim() || i18n.t('common.productFallback')
}

function cartToastPosition(): 'top-center' | 'bottom-center' {
  if (typeof window === 'undefined') return 'top-center'
  return window.matchMedia('(max-width: 1023px)').matches ? 'bottom-center' : 'top-center'
}

function cartToastSuccess(
  title: string,
  description?: string,
  id?: string,
  options?: { viewCart?: boolean },
) {
  toast.success(title, {
    id,
    description,
    duration: 3200,
    position: cartToastPosition(),
    className: 'gs-toast gs-toast-cart',
    action: options?.viewCart
      ? {
          label: i18n.t('cart.toasts.viewCart'),
          onClick: () => {
            window.dispatchEvent(new CustomEvent('gs:navigate-cart'))
          },
        }
      : undefined,
  })
}

function cartToastInfo(title: string, description?: string, id?: string) {
  toast.message(title, {
    id,
    description,
    duration: 2800,
    position: cartToastPosition(),
    className: 'gs-toast gs-toast-cart',
  })
}

/** Recompute cart totals from items (pure — safe to call before React render). */
function calculateCartTotals(items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)
  const discount_amount = 0
  const tax_amount = 0
  const total_amount = subtotal - discount_amount + tax_amount
  const item_count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  return {
    items,
    subtotal,
    discount_amount,
    tax_amount,
    total_amount,
    item_count,
  }
}

function mapServerCartToLocal(payload: Awaited<ReturnType<typeof cartApi.fetchServerCart>>): Cart {
  const itemsRaw = payload?.cart?.items
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) return defaultCart
  const items: CartItem[] = itemsRaw.map((row, idx) => {
    const p = row.product || {}
    const id = String(row.product_id || p.id || `line-${idx}`)
    const product = {
      id,
      slug: String(row.product_slug || p.slug || ''),
      sku: String(row.product_sku || p.sku || ''),
      name_en: String(row.product_name_en || p.name_en || ''),
      name_ar: String(row.product_name_ar || p.name_ar || ''),
    } as Product
    const quantity = Math.max(1, Number(row.quantity) || 1)
    const unit_price = Number(row.unit_price) || 0
    return {
      id: String(row.id || `${id}-${idx}`),
      product,
      quantity,
      unit_price,
      total_price: Number(row.total_price) || unit_price * quantity,
    }
  })
  return calculateCartTotals(items)
}

function itemsForServerSync(items: CartItem[]) {
  return items.map((item) => ({
    product_id: item.product.id,
    product_slug: item.product.slug,
    product_sku: item.product.sku,
    product_name_en: item.product.name_en,
    product_name_ar: item.product.name_ar,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function regularUnitPrice(product: Product): number {
  const n =
    product.live_total_price != null && Number.isFinite(Number(product.live_total_price))
      ? Number(product.live_total_price)
      : product.current_price != null
        ? Number(product.current_price)
        : 0
  return Number.isFinite(n) ? n : 0
}

function clubUnitPrice(product: Product): number {
  const n =
    product.live_total_price_club != null && Number.isFinite(Number(product.live_total_price_club))
      ? Number(product.live_total_price_club)
      : regularUnitPrice(product)
  return Number.isFinite(n) ? n : 0
}

function unitPriceForMembership(product: Product, clubPricingEnabled: boolean): number {
  if (!clubPricingEnabled) return regularUnitPrice(product)
  return clubUnitPrice(product)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [cart, setCart] = useState<Cart>(defaultCart)
  const [clubPricingEnabled, setClubPricingEnabled] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const itemsRef = useRef<CartItem[]>(cart.items)
  const clubPricingEnabledRef = useRef<boolean>(clubPricingEnabled)
  const repriceInFlightRef = useRef(false)
  const lastRepriceStartedAtRef = useRef(0)
  const skipNextSyncRef = useRef(false)
  const REPRICE_MIN_GAP_MS = 2500

  const assertCanPurchase = (): boolean => {
    if (authLoading) return false
    if (!isAuthenticated) {
      toast.info(i18n.t('auth.loginRequiredToBuy'), {
        id: 'purchase-login-required',
        description: i18n.t('auth.loginRequiredToBuyDesc'),
      })
      navigate(`/login?next=${encodeURIComponent('/cart')}`)
      return false
    }
    if (user?.is_verified === false) {
      toast.error(i18n.t('auth.verificationRequiredToBuy'), {
        id: 'purchase-verify-required',
        description: i18n.t('auth.verificationRequiredToBuyDesc'),
      })
      navigate('/dashboard?tab=profile')
      return false
    }
    return true
  }

  // Hydrate from Django when signed in; clear UI when logged out.
  useEffect(() => {
    let cancelled = false
    if (authLoading) return
    if (!isAuthenticated || !user?.id) {
      setCart(defaultCart)
      setHydrated(true)
      try {
        localStorage.removeItem('cart')
      } catch {
        /* ignore */
      }
      return
    }
    setHydrated(false)
    void (async () => {
      try {
        const data = await cartApi.fetchServerCart()
        if (cancelled) return
        skipNextSyncRef.current = true
        setCart(mapServerCartToLocal(data))
      } catch {
        if (!cancelled) {
          skipNextSyncRef.current = true
          setCart(defaultCart)
        }
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, user?.id])

  // Debounced sync to Django while signed in.
  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user?.id) return
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false
      return
    }
    const handle = window.setTimeout(() => {
      void cartApi.syncServerCart(itemsForServerSync(cart.items), 'web').catch(() => {
        /* soft-fail — checkout still validates on server */
      })
    }, 400)
    return () => window.clearTimeout(handle)
  }, [cart, hydrated, isAuthenticated, user?.id])

  useEffect(() => {
    itemsRef.current = cart.items
  }, [cart.items])

  useEffect(() => {
    clubPricingEnabledRef.current = clubPricingEnabled
  }, [clubPricingEnabled])

  useEffect(() => {
    setCart((prevCart) => {
      if (!prevCart.items.length) return prevCart
      let changed = false
      const nextItems = prevCart.items.map((item) => {
        const nextUnit = unitPriceForMembership(item.product, clubPricingEnabled)
        if (Math.abs((Number(item.unit_price) || 0) - nextUnit) <= 1e-9) return item
        changed = true
        return {
          ...item,
          unit_price: nextUnit,
          total_price: item.quantity * nextUnit,
        }
      })
      return changed ? calculateCartTotals(nextItems) : prevCart
    })
  }, [clubPricingEnabled])

  useEffect(() => {
    let cancelled = false

    const repriceFromLiveRates = async () => {
      if (cancelled) return
      // Checkout holds a signed quote lock — do not tick live cart money underneath it.
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/checkout')) {
        return
      }
      const now = Date.now()
      if (repriceInFlightRef.current) return
      if (now - lastRepriceStartedAtRef.current < REPRICE_MIN_GAP_MS) return

      repriceInFlightRef.current = true
      lastRepriceStartedAtRef.current = now
      const items = itemsRef.current
      if (!items.length) {
        repriceInFlightRef.current = false
        return
      }

      try {
        const isClub = clubPricingEnabledRef.current

        const rows = await Promise.all(
          items.map(async (item) => {
            const slug = item.product.slug
            if (!slug) return null
            try {
              const latest = (await productsApi.getProduct(slug)) as Product
              return { itemId: item.id, latest }
            } catch {
              return null
            }
          }),
        )

        if (cancelled) return

        const byItemId = new Map<string, Product>()
        for (const r of rows) {
          if (r?.latest) byItemId.set(r.itemId, r.latest)
        }
        if (!byItemId.size) return

        setCart((prevCart) => {
          let changed = false
          const nextItems = prevCart.items.map((item) => {
            const latest = byItemId.get(item.id)
            if (!latest) return item

            const nextUnit = unitPriceForMembership(latest, isClub)
            const nextQty = clampCartLineQuantity(latest, item.quantity)
            const unitChanged = Math.abs((Number(item.unit_price) || 0) - nextUnit) > 1e-9
            const qtyChanged = nextQty !== item.quantity
            const priceMetaChanged =
              (item.product.live_total_price ?? null) !== (latest.live_total_price ?? null) ||
              (item.product.live_total_price_club ?? null) !== (latest.live_total_price_club ?? null)
            const stockChanged = productStockFieldsChanged(item.product, latest)

            if (!unitChanged && !qtyChanged && !priceMetaChanged && !stockChanged) return item

            changed = true
            return {
              ...item,
              product: latest,
              quantity: nextQty,
              unit_price: nextUnit,
              total_price: nextQty * nextUnit,
            }
          })

          return changed ? calculateCartTotals(nextItems) : prevCart
        })
      } catch {
        // Ignore transient repricing failures; keep last known prices.
      } finally {
        repriceInFlightRef.current = false
      }
    }

    void repriceFromLiveRates()
    const id = window.setInterval(() => {
      void repriceFromLiveRates()
    }, 15_000)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const syncMembership = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        if (!cancelled) setClubPricingEnabled(false)
        return
      }
      try {
        const data = (await clubsApi.getMyMembership()) as { membership?: { role?: string } | null }
        const role = data?.membership?.role
        if (!cancelled) setClubPricingEnabled(role === 'head' || role === 'member')
      } catch {
        if (!cancelled) setClubPricingEnabled(false)
      }
    }
    void syncMembership()
    const id = window.setInterval(() => {
      void syncMembership()
    }, 5 * 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const onNavigateCart = () => navigate('/cart')
    window.addEventListener('gs:navigate-cart', onNavigateCart)
    return () => window.removeEventListener('gs:navigate-cart', onNavigateCart)
  }, [navigate])

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!assertCanPurchase()) return

    if (isProductOutOfStock(product)) {
      cartToastInfo(
        i18n.t('cart.toasts.outOfStock'),
        i18n.t('cart.toasts.outOfStockDesc', { name: productDisplayName(product) }),
        `cart-oos-${product.id}`,
      )
      return
    }

    // Toast must run after setCart, not inside the updater: React 18 Strict Mode
    // double-invokes state updaters in dev, which duplicated sonner toasts.
    let toastKind: 'added' | 'increased' | 'capped' | null = null
    let toastQty = quantity
    setCart((prevCart) => {
      if (isProductSerialized(product)) {
        const already = cartUnitsForProductId(prevCart.items, product.id)
        const room = maxPurchasableQuantity(product, already)
        const want = Math.max(1, Math.floor(quantity) || 1)
        const toAdd = Math.min(want, room)
        if (toAdd <= 0) {
          toastKind = 'capped'
          toastQty = already
          return prevCart
        }
        toastKind = toAdd < want ? 'capped' : already > 0 ? 'increased' : 'added'
        toastQty = toAdd < want ? already + toAdd : toAdd
        const unit = unitPriceForMembership(product, clubPricingEnabled)
        const newLines: CartItem[] = []
        for (let i = 0; i < toAdd; i += 1) {
          newLines.push({
            id: `${product.id}-unit-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            product,
            quantity: 1,
            unit_price: unit,
            total_price: unit,
          })
        }
        return calculateCartTotals([...prevCart.items, ...newLines])
      }

      const existingItem = prevCart.items.find((item) => item.product.id === product.id)
      const existingQty = existingItem?.quantity ?? 0
      const nextQty = clampPurchaseQuantity(product, existingQty + quantity, 0)

      if (nextQty <= 0) {
        return prevCart
      }

      if (existingQty + quantity > nextQty) {
        toastKind = 'capped'
        toastQty = nextQty
      }

      let newItems: CartItem[]

      if (existingItem) {
        const unit = unitPriceForMembership(product, clubPricingEnabled)
        const productSnapshotChanged =
          productStockFieldsChanged(existingItem.product, product) ||
          existingItem.product.live_total_price !== product.live_total_price ||
          existingItem.product.live_total_price_club !== product.live_total_price_club
        if (existingQty === nextQty && !productSnapshotChanged) {
          return prevCart
        }
        if (existingQty === nextQty && productSnapshotChanged) {
          // Refresh stale product/stock snapshot without a qty toast.
          newItems = prevCart.items.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  product,
                  unit_price: unit,
                  total_price: nextQty * unit,
                }
              : item,
          )
          return calculateCartTotals(newItems)
        }
        if (toastKind !== 'capped') {
          toastQty = nextQty
          toastKind = 'increased'
        }
        newItems = prevCart.items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: nextQty,
                unit_price: unit,
                total_price: nextQty * unit,
              }
            : item,
        )
      } else {
        toastKind = toastKind === 'capped' ? 'capped' : 'added'
        const unit = unitPriceForMembership(product, clubPricingEnabled)
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity: nextQty,
          unit_price: unit,
          total_price: nextQty * unit,
        }
        newItems = [...prevCart.items, newItem]
      }

      return calculateCartTotals(newItems)
    })

    const name = productDisplayName(product)
    if (toastKind === 'added') {
      cartToastSuccess(
        i18n.t('cart.toasts.added'),
        i18n.t('cart.toasts.addedDescCount', { name, count: toastQty }),
        `cart-add-${product.id}`,
        { viewCart: true },
      )
    } else if (toastKind === 'increased') {
      cartToastSuccess(
        i18n.t('cart.toasts.qtyIncreased'),
        i18n.t('cart.toasts.qtyIncreasedDesc', { name, qty: toastQty }),
        `cart-qty-${product.id}`,
        { viewCart: true },
      )
    } else if (toastKind === 'capped') {
      cartToastInfo(
        i18n.t('cart.toasts.maxAvailable'),
        i18n.t('cart.toasts.maxAvailableDesc', { name, count: productAvailableQuantity(product) }),
        `cart-cap-${product.id}`,
      )
    }
  }

  const removeFromCart = (itemId: string) => {
    let removedProduct: Product | null = null
    setCart((prevCart) => {
      const item = prevCart.items.find((i) => i.id === itemId)
      if (item) removedProduct = item.product
      const newItems = prevCart.items.filter((item) => item.id !== itemId)
      return calculateCartTotals(newItems)
    })
    if (removedProduct) {
      cartToastInfo(
        i18n.t('cart.toasts.removed'),
        i18n.t('cart.toasts.removedDesc', { name: productDisplayName(removedProduct) }),
        `cart-remove-${itemId}`,
      )
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    let toastPayload: { name: string; qty: number; direction: 'up' | 'down' | 'capped' } | null = null
    setCart((prevCart) => {
      const target = prevCart.items.find((item) => item.id === itemId)
      if (!target) return prevCart

      // Serialized unit lines stay qty=1; "increase" means add another unit line.
      if (isProductSerialized(target.product)) {
        if (quantity <= 1) {
          return prevCart
        }
        const already = cartUnitsForProductId(prevCart.items, target.product.id)
        const room = maxPurchasableQuantity(target.product, already)
        if (room <= 0) {
          toastPayload = {
            name: productDisplayName(target.product),
            qty: already,
            direction: 'capped',
          }
          return prevCart
        }
        const unit = unitPriceForMembership(target.product, clubPricingEnabled)
        const extra: CartItem = {
          id: `${target.product.id}-unit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          product: target.product,
          quantity: 1,
          unit_price: unit,
          total_price: unit,
        }
        toastPayload = {
          name: productDisplayName(target.product),
          qty: already + 1,
          direction: 'up',
        }
        return calculateCartTotals([...prevCart.items, extra])
      }

      const prevQty = target.quantity
      const cappedQty = clampPurchaseQuantity(target.product, quantity, 0)
      if (cappedQty <= 0) {
        return prevCart
      }

      if (prevQty === cappedQty) {
        if (quantity > prevQty) {
          toastPayload = {
            name: productDisplayName(target.product),
            qty: cappedQty,
            direction: 'capped',
          }
        }
        return prevCart
      }

      toastPayload = {
        name: productDisplayName(target.product),
        qty: cappedQty,
        direction: quantity > prevQty ? 'up' : 'down',
      }
      if (quantity > prevQty && cappedQty < quantity) {
        toastPayload.direction = 'capped'
      }

      const newItems = prevCart.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: cappedQty,
              total_price: cappedQty * item.unit_price,
            }
          : item,
      )
      return calculateCartTotals(newItems)
    })

    if (toastPayload) {
      const { name, qty, direction } = toastPayload
      if (direction === 'up') {
        cartToastSuccess(
          i18n.t('cart.toasts.qtyIncreased'),
          i18n.t('cart.toasts.qtyIncreasedDesc', { name, qty }),
          `cart-qty-${itemId}`,
        )
      } else if (direction === 'down') {
        cartToastInfo(
          i18n.t('cart.toasts.qtyDecreased'),
          i18n.t('cart.toasts.qtyDecreasedDesc', { name, qty }),
          `cart-qty-${itemId}`,
        )
      } else if (direction === 'capped') {
        cartToastInfo(
          i18n.t('cart.toasts.maxAvailable'),
          i18n.t('cart.toasts.maxAvailableDesc', { name, count: qty }),
          `cart-cap-${itemId}`,
        )
      }
    }
  }

  const clearCart = () => {
    setCart(defaultCart)
    try {
      localStorage.removeItem('cart')
    } catch {
      /* ignore */
    }
    if (isAuthenticated) {
      void cartApi.clearServerCart().catch(() => undefined)
    }
    cartToastInfo(i18n.t('cart.toasts.cleared'), i18n.t('cart.toasts.clearedDesc'), 'cart-cleared')
  }

  const getCartTotal = () => cart.total_amount

  const getItemCount = () => cart.item_count

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

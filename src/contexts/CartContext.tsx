import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import i18n from '../i18n'
import type { Product, Cart, CartItem } from '../types'
import { productsApi, clubsApi } from '../services/api'
import { useAuth } from './AuthContext'
import {
  clampPurchaseQuantity,
  isProductOutOfStock,
  productAvailableQuantity,
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

/**
 * Read cart from localStorage synchronously so the first render already has items.
 * Without this, the "save on every change" effect runs once with empty defaultCart
 * and overwrites localStorage before the async load effect runs — cart appears empty after reload.
 */
function readCartFromStorage(): Cart {
  if (typeof window === 'undefined') return defaultCart
  try {
    const raw = localStorage.getItem('cart')
    if (!raw) return defaultCart
    const parsed = JSON.parse(raw) as Partial<Cart>
    if (!parsed || !Array.isArray(parsed.items)) return defaultCart
    return calculateCartTotals(parsed.items as CartItem[])
  } catch {
    return defaultCart
  }
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
  const [cart, setCart] = useState<Cart>(readCartFromStorage)
  const [clubPricingEnabled, setClubPricingEnabled] = useState(false)
  const itemsRef = useRef<CartItem[]>(cart.items)
  const clubPricingEnabledRef = useRef<boolean>(clubPricingEnabled)
  const repriceInFlightRef = useRef(false)
  const lastRepriceStartedAtRef = useRef(0)
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

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch (e) {
      console.error('Failed to save cart:', e)
    }
  }, [cart])

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
            const unitChanged = Math.abs((Number(item.unit_price) || 0) - nextUnit) > 1e-9
            const productChanged =
              (item.product.live_total_price ?? null) !== (latest.live_total_price ?? null) ||
              (item.product.live_total_price_club ?? null) !== (latest.live_total_price_club ?? null)

            if (!unitChanged && !productChanged) return item

            changed = true
            return {
              ...item,
              product: latest,
              unit_price: nextUnit,
              total_price: item.quantity * nextUnit,
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
        if (existingQty === nextQty) {
          return prevCart
        }
        if (toastKind !== 'capped') {
          toastQty = nextQty
          toastKind = 'increased'
        }
        newItems = prevCart.items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: nextQty,
                total_price: nextQty * item.unit_price,
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
    localStorage.removeItem('cart')
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

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Product, Cart, CartItem } from '../types'
import { productsApi, clubsApi } from '../services/api'

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
    // Recompute totals so stored cart stays consistent even if schema changed slightly
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
  // Backend already role-gates live_total_price_club (head/member only).
  // If club value is present, prefer it immediately even before local membership sync settles.
  if (product.live_total_price_club != null && Number.isFinite(Number(product.live_total_price_club))) {
    return clubUnitPrice(product)
  }
  return clubPricingEnabled ? clubUnitPrice(product) : regularUnitPrice(product)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(readCartFromStorage)
  const [clubPricingEnabled, setClubPricingEnabled] = useState(false)
  const itemsRef = useRef<CartItem[]>(cart.items)
  const clubPricingEnabledRef = useRef<boolean>(clubPricingEnabled)
  const repriceInFlightRef = useRef(false)
  const lastRepriceStartedAtRef = useRef(0)
  const REPRICE_MIN_GAP_MS = 2500

  // Persist whenever cart changes (initial state already restored from storage above)
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

  // When membership role flips (head/member <-> non-member), immediately reprice
  // existing cart lines from already-loaded product fields so UI updates instantly.
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

  // Reprice cart items from live product API rates every 15 seconds.
  // This keeps cart/checkout aligned with live product prices.
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

    // Run once immediately, then every 15s.
    void repriceFromLiveRates()
    const id = window.setInterval(() => {
      void repriceFromLiveRates()
    }, 15_000)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  // Keep club eligibility fresh even when cart is empty.
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

  const addToCart = (product: Product, quantity: number = 1) => {
    // Toast must run after setCart, not inside the updater: React 18 Strict Mode
    // double-invokes state updaters in dev, which duplicated sonner toasts.
    let toastMessage: string | null = null
    setCart((prevCart) => {
      const existingItem = prevCart.items.find(
        (item) => item.product.id === product.id
      )

      let newItems: CartItem[]

      if (existingItem) {
        newItems = prevCart.items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total_price: (item.quantity + quantity) * item.unit_price,
              }
            : item
        )
        toastMessage = `Updated quantity for ${product.name_en}`
      } else {
        const unit = unitPriceForMembership(product, clubPricingEnabled)
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          unit_price: unit,
          total_price: quantity * unit,
        }
        newItems = [...prevCart.items, newItem]
        toastMessage = `Added ${product.name_en} to cart`
      }

      return calculateCartTotals(newItems)
    })
    if (toastMessage) {
      toast.success(toastMessage, {
        id: `cart-add-${product.id}`,
      })
    }
  }

  const removeFromCart = (itemId: string) => {
    let removedLabel: string | null = null
    setCart((prevCart) => {
      const item = prevCart.items.find((i) => i.id === itemId)
      if (item) {
        removedLabel = item.product.name_en
      }
      const newItems = prevCart.items.filter((item) => item.id !== itemId)
      return calculateCartTotals(newItems)
    })
    if (removedLabel) {
      toast.info(`Removed ${removedLabel} from cart`, { id: `cart-remove-${itemId}` })
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              total_price: quantity * item.unit_price,
            }
          : item
      )
      return calculateCartTotals(newItems)
    })
  }

  const clearCart = () => {
    setCart(defaultCart)
    localStorage.removeItem('cart')
    toast.info('Cart cleared', { id: 'cart-cleared' })
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

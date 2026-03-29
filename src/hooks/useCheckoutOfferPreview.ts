import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clubsApi } from '../services/api'
import type { CheckoutPreviewPayload } from '../utils/checkoutPreview'

export type CheckoutPreviewData = {
  subtotal: string
  discount_amount: string
  total_amount: string
  offer_title: string | null
  offer_id: string | null
}

function stableItemsKey(items: CheckoutPreviewPayload[]): string {
  const sorted = [...items].sort((a, b) => String(a.product_id).localeCompare(String(b.product_id)))
  return JSON.stringify(sorted.map((i) => [i.product_id, i.quantity]))
}

export function useCheckoutOfferPreview(items: CheckoutPreviewPayload[]) {
  const key = useMemo(() => stableItemsKey(items), [items])

  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('access_token')

  return useQuery({
    queryKey: ['checkoutOfferPreview', key],
    queryFn: () => clubsApi.checkoutPreview(items) as Promise<CheckoutPreviewData>,
    enabled: hasToken && items.length > 0,
    staleTime: 30_000,
  })
}

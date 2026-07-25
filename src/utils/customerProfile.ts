export type CustomerProfileAddress = {
  id?: string
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  governorate?: string | null
  postal_code?: string | null
  country?: string | null
}

export type SavedAddressLike = {
  id?: string
  label?: string
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  governorate?: string | null
  postal_code?: string | null
  country?: string | null
  is_default?: boolean
}

/** Normalize list / paginated / single-object profile API responses. */
export function asSingleCustomerProfile(data: unknown): CustomerProfileAddress | null {
  if (!data) return null
  if (Array.isArray(data)) return (data[0] as CustomerProfileAddress) ?? null
  const p = data as { results?: CustomerProfileAddress[]; id?: string; user?: unknown }
  if (p.results && p.results.length > 0) return p.results[0]
  if (typeof p.id === 'string' && p.user !== undefined) return p as CustomerProfileAddress
  return null
}

export function profileHasSavedAddress(p: CustomerProfileAddress): boolean {
  return Boolean(
    (p.address_line1 && p.address_line1.trim())
    || (p.city && p.city.trim())
    || (p.governorate && p.governorate.trim()),
  )
}

export function shippingDiffersFromProfile(
  p: CustomerProfileAddress,
  shipping: { address: string; city: string; governorate: string; postalCode: string },
): boolean {
  const savedCombined = [p.address_line1, p.address_line2].filter(Boolean).join(', ')
  const norm = (s: string) => s.trim().toLowerCase()
  return (
    norm(shipping.address) !== norm(savedCombined)
    || norm(shipping.city) !== norm(p.city ?? '')
    || norm(shipping.governorate) !== norm(p.governorate ?? '')
    || norm(shipping.postalCode) !== norm(p.postal_code ?? '')
  )
}

export function shippingMatchesSavedAddress(
  a: SavedAddressLike,
  shipping: { address: string; city: string; governorate: string; postalCode: string },
): boolean {
  const savedCombined = [a.address_line1, a.address_line2].filter(Boolean).join(', ')
  const norm = (s: string) => s.trim().toLowerCase()
  return (
    norm(shipping.address) === norm(savedCombined)
    && norm(shipping.city) === norm(a.city ?? '')
    && norm(shipping.governorate) === norm(a.governorate ?? '')
    && norm(shipping.postalCode) === norm(a.postal_code ?? '')
  )
}

export function formatProfileShippingAddress(p: CustomerProfileAddress | SavedAddressLike): {
  address: string
  city: string
  governorate: string
  postalCode: string
} {
  return {
    address: [p.address_line1, p.address_line2].filter(Boolean).join(', '),
    city: p.city ?? '',
    governorate: p.governorate ?? '',
    postalCode: p.postal_code ?? '',
  }
}

export function applySavedAddressToShipping(a: SavedAddressLike): {
  address: string
  city: string
  governorate: string
  postalCode: string
} {
  return formatProfileShippingAddress(a)
}

export type CustomerProfileAddress = {
  id?: string
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  governorate?: string | null
  postal_code?: string | null
  country?: string | null
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

export function formatProfileShippingAddress(p: CustomerProfileAddress): {
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

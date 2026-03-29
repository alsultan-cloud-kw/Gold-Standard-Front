/** Backend roles allowed on public registration and treated as storefront users. */
export const STOREFRONT_USER_ROLES = ['customer', 'long_term_customer', 'trader'] as const
export type StorefrontUserRole = (typeof STOREFRONT_USER_ROLES)[number]

export function isStorefrontRole(role: string): role is StorefrontUserRole {
  return (STOREFRONT_USER_ROLES as readonly string[]).includes(role)
}

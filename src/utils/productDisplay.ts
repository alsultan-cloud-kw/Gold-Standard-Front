import type { Product } from '@/types'

export type ProductIdentity = {
  kind: 'serial' | 'barcode' | 'sku'
  value: string
}

function normalizedIdentityValue(value: string | null | undefined): string {
  return (value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

/** Printed codes never contain whitespace; product names always do or match a name. */
function isCodeShaped(value: string): boolean {
  return value.length > 0 && !/\s/.test(value)
}

/**
 * Customer-facing product identity; never present a product name as a code.
 * Mirrored in Gold-Standard-Mobile-App/utils/productDisplay.ts — keep both in sync.
 */
export function productDisplayIdentity(
  product: Pick<Product, 'name_en' | 'name_ar' | 'sku' | 'serial_number' | 'barcode_value'>,
): ProductIdentity | null {
  const names = new Set(
    [product.name_en, product.name_ar]
      .map(normalizedIdentityValue)
      .filter(Boolean),
  )
  const serial = product.serial_number?.trim() || ''
  const barcode = product.barcode_value?.trim() || ''
  const sku = product.sku?.trim() || ''
  // Django backfills a blank barcode with the serial or SKU, so a barcode that
  // repeats either is not a separate code worth labelling.
  const barcodeRepeatsAnotherCode =
    normalizedIdentityValue(barcode) === normalizedIdentityValue(serial) ||
    normalizedIdentityValue(barcode) === normalizedIdentityValue(sku)
  const candidates: ProductIdentity[] = [
    { kind: 'serial', value: serial },
    { kind: 'barcode', value: barcodeRepeatsAnotherCode ? '' : barcode },
    { kind: 'sku', value: sku },
  ]

  return (
    candidates.find(
      ({ value }) => isCodeShaped(value) && !names.has(normalizedIdentityValue(value)),
    ) || null
  )
}

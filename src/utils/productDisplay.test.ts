// @vitest-environment node
/// <reference types="vitest/globals" />

import { productDisplayIdentity } from './productDisplay'

describe('productDisplayIdentity', () => {
  it('prefers serial number over barcode and SKU', () => {
    expect(
      productDisplayIdentity({
        name_en: 'Saudi gold coin',
        name_ar: 'عملة ذهب سعودية',
        serial_number: 'SER-001',
        barcode_value: 'BAR-001',
        sku: 'SKU-001',
      }),
    ).toEqual({ kind: 'serial', value: 'SER-001' })
  })

  it('never labels a product name as its code', () => {
    expect(
      productDisplayIdentity({
        name_en: 'Saudi gold coin',
        name_ar: 'عملة ذهب سعودية',
        sku: ' Saudi gold coin ',
      }),
    ).toBeNull()
  })

  it('falls back to a genuine SKU', () => {
    expect(
      productDisplayIdentity({
        name_en: 'Saudi gold coin',
        name_ar: 'عملة ذهب سعودية',
        sku: 'KSA-COIN-22K',
      }),
    ).toEqual({ kind: 'sku', value: 'KSA-COIN-22K' })
  })

  it('labels a barcode backfilled from the SKU as the SKU', () => {
    expect(
      productDisplayIdentity({
        name_en: 'Saudi gold coin',
        name_ar: 'عملة ذهب سعودية',
        sku: 'KSA-COIN-22K',
        barcode_value: 'KSA-COIN-22K',
      }),
    ).toEqual({ kind: 'sku', value: 'KSA-COIN-22K' })
  })

  it('labels a barcode backfilled from the serial as the serial', () => {
    expect(
      productDisplayIdentity({
        name_en: 'Saudi gold coin',
        name_ar: 'عملة ذهب سعودية',
        sku: 'KSA-COIN-22K',
        serial_number: 'SER-001',
        barcode_value: 'SER-001',
      }),
    ).toEqual({ kind: 'serial', value: 'SER-001' })
  })

  it('rejects a stale code that reads like a name', () => {
    expect(
      productDisplayIdentity({
        name_en: 'Kuwaiti gold bar',
        name_ar: 'سبيكة ذهب كويتية',
        sku: 'Saudi gold coin, 22K',
      }),
    ).toBeNull()
  })

  it('returns null when every field is empty', () => {
    expect(
      productDisplayIdentity({
        name_en: 'Saudi gold coin',
        name_ar: 'عملة ذهب سعودية',
        sku: '',
        serial_number: null,
        barcode_value: null,
      }),
    ).toBeNull()
  })
})

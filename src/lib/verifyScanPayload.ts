/** Pull a Gold Standard serial / verify code out of a scanned QR or barcode. */
export function parseVerifyScanPayload(raw: string): string {
  const text = (raw || '').trim()
  if (!text) return ''

  try {
    const url = new URL(text)
    const fromQuery =
      url.searchParams.get('code') ||
      url.searchParams.get('q') ||
      url.searchParams.get('serial') ||
      url.searchParams.get('barcode')
    if (fromQuery?.trim()) return fromQuery.trim()

    const parts = url.pathname.split('/').filter(Boolean)
    const verifyIdx = parts.findIndex((p) => p.toLowerCase() === 'verify')
    if (verifyIdx >= 0) {
      const next = parts[verifyIdx + 1]
      if (next && next.toLowerCase() !== 'passport' && next.toLowerCase() !== 'unit') {
        return decodeURIComponent(next)
      }
      const afterPassport = parts[verifyIdx + 2]
      if (next?.toLowerCase() === 'passport' && afterPassport) {
        return decodeURIComponent(afterPassport)
      }
    }
  } catch {
    /* not a URL */
  }

  return text
}

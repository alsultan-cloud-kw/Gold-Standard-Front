import axios, { isAxiosError } from 'axios'
import { getApiBaseUrl } from '@/lib/apiBase'

async function blobErrorMessage(data: unknown): Promise<string | null> {
  if (!(data instanceof Blob)) return null
  try {
    const text = (await data.text()).trim()
    if (!text) return null
    try {
      const parsed = JSON.parse(text) as { detail?: string; message?: string }
      if (typeof parsed.detail === 'string' && parsed.detail.trim()) return parsed.detail.trim()
      if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message.trim()
    } catch {
      /* plain text body */
    }
    return text.slice(0, 280)
  } catch {
    return null
  }
}

/**
 * Download the canonical sale invoice PDF (same file WhatsApp receives).
 *
 * Cache-bust via query only — do NOT send Cache-Control/Pragma request headers;
 * those are not in Django CORS_ALLOW_HEADERS and break browser preflight to the API host.
 */
export async function downloadSaleInvoicePdf(
  saleId: string,
  filenameHint?: string,
): Promise<void> {
  const token = localStorage.getItem('access_token')
  const lang = localStorage.getItem('app_lang') || document.documentElement.getAttribute('lang') || 'ar'
  const bust = Date.now()

  let response
  try {
    response = await axios.get(`${getApiBaseUrl()}/invoices/sale_pdf/${saleId}/`, {
      params: { force: 1, _: bust },
      responseType: 'blob',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept-Language': lang.startsWith('ar') ? 'ar' : 'en',
      },
    })
  } catch (err) {
    if (isAxiosError(err)) {
      const fromBlob = await blobErrorMessage(err.response?.data)
      if (fromBlob) throw new Error(fromBlob)
      if (err.response?.status === 401) throw new Error('Please sign in again to download the invoice')
      if (err.response?.status === 403) throw new Error('You do not have access to this invoice')
      if (err.response?.status === 404) throw new Error('Invoice not found')
      if (err.message) throw new Error(err.message)
    }
    throw err instanceof Error ? err : new Error('Could not download invoice PDF')
  }

  const blob = response.data as Blob
  const contentType = (response.headers['content-type'] as string | undefined) || blob.type || ''
  if (contentType.includes('json') || blob.type?.includes('json')) {
    const text = await blob.text()
    let detail = text || 'Could not download invoice PDF'
    try {
      const parsed = JSON.parse(text) as { detail?: string }
      if (parsed.detail) detail = parsed.detail
    } catch {
      /* keep text */
    }
    throw new Error(detail)
  }

  // Guard against empty / HTML error pages returned as 200 with wrong type
  if (!blob || blob.size < 100) {
    throw new Error('Invoice PDF was empty — please try again')
  }

  let filename = filenameHint || `invoice-${saleId}.pdf`
  const disposition = response.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="([^"]+)"/)
  if (match?.[1]) filename = match[1]

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

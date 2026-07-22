import axios from 'axios'
import { getApiBaseUrl } from '@/lib/apiBase'

/**
 * Download the canonical sale invoice PDF (same file WhatsApp receives).
 */
export async function downloadSaleInvoicePdf(
  saleId: string,
  filenameHint?: string,
): Promise<void> {
  const token = localStorage.getItem('access_token')
  const lang = localStorage.getItem('app_lang') || document.documentElement.getAttribute('lang') || 'ar'
  const response = await axios.get(`${getApiBaseUrl()}/invoices/sale_pdf/${saleId}/`, {
    responseType: 'blob',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Accept-Language': lang.startsWith('ar') ? 'ar' : 'en',
    },
  })

  const blob = response.data as Blob
  if (blob.type?.includes('json')) {
    const text = await blob.text()
    throw new Error(text || 'Could not download invoice PDF')
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

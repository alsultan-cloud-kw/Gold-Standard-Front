/** Turn DRF / axios error bodies into a single user-facing string. */
export function formatApiErrorMessage(error: unknown, fallback: string): string {
  const ax = error as { response?: { data?: unknown } }
  const data = ax.response?.data
  if (!data || typeof data !== 'object') return fallback

  const d = data as Record<string, unknown>

  if (typeof d.detail === 'string') return d.detail

  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length > 0) {
    return d.non_field_errors.map(String).join(' ')
  }

  const fieldParts: string[] = []
  for (const [key, val] of Object.entries(d)) {
    if (key === 'detail') continue
    if (Array.isArray(val) && val.length > 0) {
      fieldParts.push(val.map(String).join(' '))
    } else if (typeof val === 'string') {
      fieldParts.push(val)
    }
  }
  if (fieldParts.length > 0) return fieldParts.join(' ')

  return fallback
}

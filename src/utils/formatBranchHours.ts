const EASTERN_DIGITS = '٠١٢٣٤٥٦٧٨٩'

function toEasternDigits(value: string): string {
  return value.replace(/\d/g, (d) => EASTERN_DIGITS[Number(d)])
}

/** API times like "09:00:00" → "9:00 AM" / "٩:٠٠ ص" */
export function formatBranchTime12h(raw?: string | null, isAr = false): string | null {
  if (!raw) return null
  const m = String(raw).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return raw

  const hour24 = Number(m[1])
  const minute = m[2]
  let hour12 = hour24 % 12
  if (hour12 === 0) hour12 = 12

  if (isAr) {
    const period = hour24 >= 12 ? 'م' : 'ص'
    return `${toEasternDigits(`${hour12}:${minute}`)} ${period}`
  }

  const period = hour24 >= 12 ? 'PM' : 'AM'
  return `${hour12}:${minute} ${period}`
}

import type { Branch } from '@/types'
import { GS_MAIN_LOCATION } from '@/constants/location'

/** Kuwait City — default map center when no branch is selected. */
export const KUWAIT_MAP_CENTER = {
  lat: GS_MAIN_LOCATION.lat,
  lng: GS_MAIN_LOCATION.lng,
} as const

/** Customer-facing map/card badge — never expose internal codes like MAIN → MAI. */
export function branchMarkerLabel(): string {
  return 'GS'
}

export const GS_MAIN_BRANCH_COORDS = {
  lat: GS_MAIN_LOCATION.lat,
  lng: GS_MAIN_LOCATION.lng,
} as const

function parseCoord(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function branchCoords(branch: Branch): { lat: number; lng: number } | null {
  const lat = parseCoord(branch.latitude)
  const lng = parseCoord(branch.longitude)
  if (lat == null || lng == null) return null
  return { lat, lng }
}

/** Map display coords — real API coords, or main-branch fallback in Kuwait. */
export function branchMapCoords(branch: Branch): { lat: number; lng: number } | null {
  const coords = branchCoords(branch)
  if (coords) return coords
  if (branch.is_main_branch) return GS_MAIN_BRANCH_COORDS
  return null
}

export function branchMapsUrl(branch: Branch): string {
  if (branch.is_main_branch) return GS_MAIN_LOCATION.directionsUrl
  const coords = branchMapCoords(branch) ?? branchCoords(branch)
  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat}%2C${coords.lng}`
  }
  const query = formatBranchAddress(branch, false)
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}

export function branchGooglePlaceUrl(branch: Branch): string | null {
  if (branch.is_main_branch) return GS_MAIN_LOCATION.placeUrl
  const coords = branchMapCoords(branch)
  if (!coords) return null
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
}

function normalizeGovernorate(value: string, isAr: boolean): string | null {
  const key = value.trim().toLowerCase()
  if (!key || key === 'kuwait') return null
  if (key === 'capital') return isAr ? 'العاصمة' : 'Capital'
  return value.trim()
}

/** Customer-facing branch address — dedupes messy API fields and localizes main branch. */
export function formatBranchAddress(branch: Branch, isAr: boolean): string {
  if (branch.is_main_branch) {
    return isAr ? GS_MAIN_LOCATION.addressAr : GS_MAIN_LOCATION.addressEn
  }

  const seen = new Set<string>()
  const parts: string[] = []
  const push = (value?: string | null) => {
    const trimmed = value?.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    parts.push(trimmed)
  }

  push(branch.address)

  const city = branch.city?.trim()
  if (city && !branch.address?.toLowerCase().includes(city.toLowerCase())) {
    push(city)
  }

  const governorate = branch.governorate
    ? normalizeGovernorate(branch.governorate, isAr)
    : null
  if (governorate) push(governorate)

  if (!parts.length) return isAr ? 'الكويت' : 'Kuwait'
  return parts.join(isAr ? ' · ' : ', ')
}

export function mapBoundsForBranches(branches: Branch[]): [[number, number], [number, number]] | null {
  const points = branches
    .map((b) => branchMapCoords(b) ?? branchCoords(b))
    .filter((p): p is { lat: number; lng: number } => p != null)
  if (!points.length) return null

  let minLat = points[0].lat
  let maxLat = points[0].lat
  let minLng = points[0].lng
  let maxLng = points[0].lng

  for (const p of points) {
    minLat = Math.min(minLat, p.lat)
    maxLat = Math.max(maxLat, p.lat)
    minLng = Math.min(minLng, p.lng)
    maxLng = Math.max(maxLng, p.lng)
  }

  const latPad = Math.max((maxLat - minLat) * 0.2, 0.02)
  const lngPad = Math.max((maxLng - minLng) * 0.2, 0.02)

  return [
    [minLat - latPad, minLng - lngPad],
    [maxLat + latPad, maxLng + lngPad],
  ]
}

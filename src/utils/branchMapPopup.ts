import type { Branch } from '@/types'
import { GS_MAIN_LOCATION } from '@/constants/location'
import { branchGooglePlaceUrl, branchMapsUrl, branchMarkerLabel, formatBranchAddress } from '@/utils/branchMap'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type BranchPopupLabels = {
  mainBadge: string
  getDirections: string
  hoursWeekday: string
  hoursFriday: string
  fridayClosed: string
  googleReviews: string
}

export function buildBranchPopupHtml(
  branch: Branch,
  labels: BranchPopupLabels,
  isAr: boolean,
  formatTime: (raw?: string | null) => string | null,
): string {
  const name = escapeHtml(isAr && branch.name_ar ? branch.name_ar : branch.name_en)
  const address = escapeHtml(formatBranchAddress(branch, isAr))
  const open = formatTime(branch.opening_time)
  const close = formatTime(branch.closing_time)
  const friOpen = formatTime(branch.friday_opening_time)
  const friClose = formatTime(branch.friday_closing_time)
  const hoursWeekday = escapeHtml(labels.hoursWeekday.replace('{{open}}', open ?? '—').replace('{{close}}', close ?? '—'))
  const hoursFriday =
    branch.is_open_friday && friOpen && friClose
      ? escapeHtml(labels.hoursFriday.replace('{{open}}', friOpen).replace('{{close}}', friClose))
      : escapeHtml(labels.fridayClosed)
  const directionsUrl = escapeHtml(branchMapsUrl(branch))
  const badge = escapeHtml(branchMarkerLabel())
  const mainBadge = branch.is_main_branch
    ? `<span class="gs-map-popup__badge">${escapeHtml(labels.mainBadge)}</span>`
    : ''
  const placeUrl = branchGooglePlaceUrl(branch)
  const ratingRow =
    branch.is_main_branch && placeUrl
      ? `<a class="gs-map-popup__rating" href="${escapeHtml(placeUrl)}" target="_blank" rel="noopener noreferrer" dir="ltr">
          <span class="gs-map-popup__rating-g" aria-hidden="true">G</span>
          <span class="gs-map-popup__rating-stars" aria-hidden="true">★★★★★</span>
          <span class="gs-map-popup__rating-value">${GS_MAIN_LOCATION.googleRating.toFixed(1)}</span>
          <span class="gs-map-popup__rating-label">${escapeHtml(labels.googleReviews)}</span>
        </a>`
      : ''

  const phoneRow = branch.phone
    ? `<a class="gs-map-popup__link" href="tel:${branch.phone.replace(/\s/g, '')}" dir="ltr">${escapeHtml(branch.phone)}</a>`
    : ''

  return `
    <div class="gs-map-popup">
      <div class="gs-map-popup__head">
        <span class="gs-map-popup__code">${badge}</span>
        <div class="gs-map-popup__titles">
          <p class="gs-map-popup__name">${name}</p>
          ${mainBadge}
        </div>
      </div>
      <p class="gs-map-popup__address">${address}</p>
      ${ratingRow}
      ${phoneRow ? `<p class="gs-map-popup__phone">${phoneRow}</p>` : ''}
      <div class="gs-map-popup__hours">
        <p>${hoursWeekday}</p>
        <p class="gs-map-popup__hours-muted">${hoursFriday}</p>
      </div>
      <a class="gs-map-popup__cta" href="${directionsUrl}" target="_blank" rel="noopener noreferrer">
        ${escapeHtml(labels.getDirections)}
      </a>
    </div>
  `
}

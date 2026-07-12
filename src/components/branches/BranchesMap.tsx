import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import type { Branch } from '@/types'
import { KUWAIT_MAP_CENTER, branchMapCoords, branchMarkerLabel } from '@/utils/branchMap'
import { buildBranchPopupHtml, escapeHtml } from '@/utils/branchMapPopup'
import { formatBranchTime12h } from '@/utils/formatBranchHours'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

type Props = {
  branches: Branch[]
  selectedId: string | null
  onSelect: (id: string) => void
  formatTime: (raw?: string | null) => string | null
  className?: string
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://carto.com/attributions">CARTO</a>'

function createBrandedMarkerIcon(active: boolean) {
  const badge = escapeHtml(branchMarkerLabel())
  return L.divIcon({
    className: 'gs-map-marker-wrap',
    html: `
      <div class="gs-map-marker ${active ? 'gs-map-marker--active' : ''}" aria-hidden="true">
        <div class="gs-map-marker__pulse"></div>
        <div class="gs-map-marker__body">
          <span class="gs-map-marker__shine"></span>
          <span class="gs-map-marker__badge">${badge}</span>
        </div>
        <div class="gs-map-marker__tip"></div>
        <div class="gs-map-marker__shadow"></div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -46],
  })
}

function formatTimeStatic(raw: string | null | undefined, isAr: boolean) {
  return formatBranchTime12h(raw, isAr)
}

export function BranchesMap({ branches, selectedId, onSelect, formatTime, className }: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map())
  const onSelectRef = useRef(onSelect)
  const formatTimeRef = useRef(formatTime)
  const labelsRef = useRef({
    mainBadge: t('branchesPage.mainBadge'),
    getDirections: t('branchesPage.getDirections'),
    hoursWeekday: t('branchesPage.hoursWeekday'),
    hoursFriday: t('branchesPage.hoursFriday'),
    fridayClosed: t('branchesPage.fridayClosed'),
    googleReviews: t('branchesPage.googleReviewsLabel'),
    fitAll: t('branchesPage.mapFitAll'),
  })

  onSelectRef.current = onSelect
  formatTimeRef.current = formatTime
  labelsRef.current = {
    mainBadge: t('branchesPage.mainBadge'),
    getDirections: t('branchesPage.getDirections'),
    hoursWeekday: t('branchesPage.hoursWeekday'),
    hoursFriday: t('branchesPage.hoursFriday'),
    fridayClosed: t('branchesPage.fridayClosed'),
    googleReviews: t('branchesPage.googleReviewsLabel'),
    fitAll: t('branchesPage.mapFitAll'),
  }

  useEffect(() => {
    const node = containerRef.current
    if (!node || mapRef.current) return

    const map = L.map(node, {
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: true,
    }).setView([KUWAIT_MAP_CENTER.lat, KUWAIT_MAP_CENTER.lng], 11)

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map)

    L.control.zoom({ position: isAr ? 'topleft' : 'topright' }).addTo(map)
    L.control.scale({ position: 'bottomleft', imperial: false, metric: true }).addTo(map)

    const FitBranchesControl = L.Control.extend({
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'gs-map-fit-btn')
        btn.type = 'button'
        btn.title = labelsRef.current.fitAll
        btn.setAttribute('aria-label', labelsRef.current.fitAll)
        btn.innerHTML = `<span class="gs-map-fit-btn__icon" aria-hidden="true">◎</span>`
        L.DomEvent.disableClickPropagation(btn)
        L.DomEvent.on(btn, 'click', (e) => {
          L.DomEvent.preventDefault(e)
          const mappable = [...markersByIdRef.current.values()]
          if (!mappable.length) {
            map.setView([KUWAIT_MAP_CENTER.lat, KUWAIT_MAP_CENTER.lng], 11)
            return
          }
          const group = L.featureGroup(mappable)
          map.fitBounds(group.getBounds(), { padding: [48, 48], maxZoom: 14 })
        })
        return btn
      },
    })
    new FitBranchesControl({ position: isAr ? 'topright' : 'topleft' }).addTo(map)

    mapRef.current = map

    const invalidate = () => map.invalidateSize({ animate: false })
    invalidate()
    const raf = requestAnimationFrame(invalidate)
    const t1 = window.setTimeout(invalidate, 120)
    const t2 = window.setTimeout(invalidate, 400)

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidate) : null
    resizeObserver?.observe(node)
    window.addEventListener('resize', invalidate)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', invalidate)
      map.remove()
      mapRef.current = null
      markersByIdRef.current.clear()
    }
  }, [isAr])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const marker of markersByIdRef.current.values()) {
      marker.remove()
    }
    markersByIdRef.current.clear()

    const mappable = branches.filter((b) => branchMapCoords(b) != null)
    const labels = labelsRef.current

    for (const branch of mappable) {
      const coords = branchMapCoords(branch)!
      const active = branch.id === selectedId
      const marker = L.marker([coords.lat, coords.lng], {
        icon: createBrandedMarkerIcon(active),
        riseOnHover: true,
        riseOffset: 250,
      })

      const popupHtml = buildBranchPopupHtml(
        branch,
        labels,
        isAr,
        (raw) => formatTimeRef.current(raw) ?? formatTimeStatic(raw, isAr),
      )
      marker.bindPopup(popupHtml, {
        className: 'gs-map-popup-shell',
        maxWidth: 280,
        minWidth: 220,
        closeButton: true,
        autoPan: true,
        autoPanPadding: [24, 24],
      })

      marker.on('click', () => {
        onSelectRef.current(branch.id)
        marker.openPopup()
      })

      marker.addTo(map)
      markersByIdRef.current.set(branch.id, marker)
    }

    map.invalidateSize({ animate: false })
  }, [branches, selectedId, isAr, t])

  const branchesFingerprint = branches.map((b) => b.id).join('|')

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const points = branches
      .map((branch) => branchMapCoords(branch))
      .filter((p): p is { lat: number; lng: number } => p != null)

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: false })
    } else {
      map.setView([KUWAIT_MAP_CENTER.lat, KUWAIT_MAP_CENTER.lng], 11, { animate: false })
    }
  }, [branchesFingerprint])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return

    const marker = markersByIdRef.current.get(selectedId)
    const branch = branches.find((b) => b.id === selectedId)
    if (!marker || !branch) return

    const coords = branchMapCoords(branch)
    if (!coords) return

    map.flyTo([coords.lat, coords.lng], 15, { duration: 0.65 })

    const prefersDesktopPopup = window.matchMedia('(min-width: 1024px)').matches
    if (prefersDesktopPopup) {
      window.setTimeout(() => marker.openPopup(), 520)
    }
  }, [selectedId, branches])

  return (
    <div
      ref={containerRef}
      className={cn('branches-map-root', className)}
      role="application"
      aria-label={t('branchesPage.mapAria')}
    />
  )
}

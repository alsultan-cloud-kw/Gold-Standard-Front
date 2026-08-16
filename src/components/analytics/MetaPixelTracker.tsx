import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initializeMetaPixel, newMetaEventId, trackMetaEvent } from '@/lib/metaPixel'

let lastTrackedLocation = ''

export default function MetaPixelTracker() {
  const location = useLocation()

  useEffect(() => {
    const locationKey = location.pathname
    let cancelled = false

    void initializeMetaPixel().then(() => {
      if (cancelled || lastTrackedLocation === locationKey) return
      lastTrackedLocation = locationKey
      trackMetaEvent('page_view', 'PageView', {
        page_title: document.title,
        page_path: locationKey,
      })
    })

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>('a[href]')
      const href = anchor?.href.toLowerCase() ?? ''
      if (
        !href.includes('wa.me/') &&
        !href.includes('whatsapp.com/') &&
        !href.startsWith('whatsapp:')
      ) {
        return
      }
      trackMetaEvent(
        'join_chat',
        'JoinChat',
        { channel: 'whatsapp' },
        { custom: true, eventId: newMetaEventId('join-chat') },
      )
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}

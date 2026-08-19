import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, CameraOff, ShieldCheck, X } from 'lucide-react'
import { isMobileCameraClient, isSecureCameraContext } from '@/lib/isMobileCameraClient'
import { parseVerifyScanPayload } from '@/lib/verifyScanPayload'

type ScanPhase = 'prompt' | 'requesting' | 'live' | 'denied' | 'unsupported'

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

function createDetector(): BarcodeDetectorLike | null {
  const Ctor = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector
  if (!Ctor) return null
  try {
    return new Ctor({
      formats: [
        'qr_code',
        'aztec',
        'data_matrix',
        'pdf417',
        'code_128',
        'code_39',
        'code_93',
        'ean_13',
        'ean_8',
        'upc_a',
        'upc_e',
        'itf',
      ],
    })
  } catch {
    try {
      return new Ctor()
    } catch {
      return null
    }
  }
}

export function VerifyCameraScan({
  onCode,
}: {
  onCode: (code: string) => void
}) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<ScanPhase>('prompt')
  const [errorDetail, setErrorDetail] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode

  useEffect(() => {
    setVisible(isMobileCameraClient())
  }, [])

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
  }, [])

  useEffect(() => () => stopStream(), [stopStream])

  const handleDecoded = useCallback(
    (raw: string) => {
      const code = parseVerifyScanPayload(raw)
      if (!code) return
      stopStream()
      setPhase('prompt')
      onCodeRef.current(code)
    },
    [stopStream],
  )

  const startDetectLoop = useCallback(
    (video: HTMLVideoElement) => {
      const detector = createDetector()
      if (!detector) return

      let last = 0
      const tick = (now: number) => {
        rafRef.current = requestAnimationFrame(tick)
        if (now - last < 220) return
        last = now
        if (video.readyState < 2) return
        void detector
          .detect(video)
          .then((codes) => {
            const raw = codes.find((c) => c.rawValue)?.rawValue
            if (raw) handleDecoded(raw)
          })
          .catch(() => {
            /* keep scanning */
          })
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [handleDecoded],
  )

  const requestCamera = async () => {
    setErrorDetail('')
    if (!isSecureCameraContext()) {
      setPhase('unsupported')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('unsupported')
      return
    }

    setPhase('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      setPhase('live')
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => undefined)
        startDetectLoop(video)
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPhase('denied')
        return
      }
      if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setPhase('unsupported')
        setErrorDetail(t('authenticity.scanNoCamera'))
        return
      }
      setPhase('denied')
      setErrorDetail(t('authenticity.scanFailed'))
    }
  }

  const closeLive = () => {
    stopStream()
    setPhase('prompt')
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    const detector = createDetector()
    if (!detector) {
      setErrorDetail(t('authenticity.scanReadFailed'))
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      const codes = await detector.detect(bitmap)
      bitmap.close()
      const raw = codes.find((c) => c.rawValue)?.rawValue
      if (raw) {
        handleDecoded(raw)
        return
      }
      setErrorDetail(t('authenticity.scanReadFailed'))
    } catch {
      setErrorDetail(t('authenticity.scanReadFailed'))
    }
  }

  if (!visible) return null

  return (
    <div className="mt-4 rounded-2xl border border-[#3F6F00]/15 bg-[#ECFCCB]/25 p-4 text-start">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#3F6F00]/20 bg-white text-[#3F6F00]">
          <Camera className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">{t('authenticity.scanTitle')}</p>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">{t('authenticity.scanBody')}</p>
        </div>
      </div>

      {phase === 'prompt' || phase === 'requesting' ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void requestCamera()}
            disabled={phase === 'requesting'}
            className="gold-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 sm:flex-1"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {phase === 'requesting' ? t('authenticity.scanRequesting') : t('authenticity.scanAllow')}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 sm:flex-1"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {t('authenticity.scanPhoto')}
          </button>
        </div>
      ) : null}

      <div className={`mt-4 overflow-hidden rounded-xl border border-stone-200 bg-stone-950 ${phase === 'live' ? '' : 'hidden'}`}>
        <div className="relative">
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <p className="pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-black/55 px-3 py-2 text-center text-xs font-medium text-white">
            {t('authenticity.scanLiveHint')}
          </p>
          <button
            type="button"
            onClick={closeLive}
            className="absolute end-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-stone-900"
            aria-label={t('authenticity.scanClose')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {phase === 'denied' ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2 text-amber-950">
            <CameraOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="text-sm leading-relaxed">{t('authenticity.scanDenied')}</p>
          </div>
          <button
            type="button"
            onClick={() => void requestCamera()}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-900 ring-1 ring-stone-200"
          >
            {t('authenticity.scanRetry')}
          </button>
        </div>
      ) : null}

      {phase === 'unsupported' ? (
        <p className="mt-3 text-sm leading-relaxed text-amber-800">
          {errorDetail || t('authenticity.scanUnsupported')}
        </p>
      ) : null}

      {errorDetail && phase !== 'unsupported' ? (
        <p className="mt-2 text-sm text-amber-800" role="status">
          {errorDetail}
        </p>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          void onPhoto(file)
        }}
      />
    </div>
  )
}

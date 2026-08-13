import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { adminApi, apiService, type DaralsabaekPublicRatesResponse } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import {
  buildSpotPriceAlertPayloads,
  resolveNotificationMethod,
  type NotificationMethod,
  type PriceReminderBuildErrorCode,
} from '../../lib/priceReminderPayloads'

const BUILD_ERROR_CODES = new Set<PriceReminderBuildErrorCode>([
  'liveRatesUnavailable',
  'invalidDelta',
  'noValidRates',
])

export function usePriceReminder(enabled = true) {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [deltaInput, setDeltaInput] = useState('1.000')
  const [pushOn, setPushOn] = useState(true)
  const [whatsappOn, setWhatsappOn] = useState(true)
  const [emailOn, setEmailOn] = useState(false)

  const active = enabled && isAuthenticated && !authLoading

  const { data, isLoading } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
    enabled: active,
  })

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const carats = res?.carats ?? []

  const delta = parseFloat(deltaInput)
  const deltaValid = Number.isFinite(delta) && delta > 0

  const notificationMethod: NotificationMethod | null = useMemo(
    () => resolveNotificationMethod({ push: pushOn, whatsapp: whatsappOn, email: emailOn }),
    [pushOn, whatsappOn, emailOn],
  )

  const watchSummary = useMemo(() => {
    if (!res?.succeeded) return null
    const goldKeys = carats.map((c) => c.key).filter(Boolean)
    return { goldKeys }
  }, [res, carats])

  const createAlertsMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('LOGIN_REQUIRED')
      }
      if (!notificationMethod) {
        throw new Error('NO_CHANNEL')
      }
      const built = buildSpotPriceAlertPayloads({
        res,
        delta,
        deltaValid,
        notificationMethod,
      })
      if (!built.ok) throw new Error(built.errorCode)
      await Promise.all(built.payloads.map((p) => apiService.post('/accounts/price-alerts/', p)))
    },
    onSuccess: () => {
      toast.success(t('priceReminder.toastSaved'))
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        if (err.message === 'NO_CHANNEL') {
          toast.error(t('priceReminder.needChannel'))
          return
        }
        const code = err.message as PriceReminderBuildErrorCode
        if (BUILD_ERROR_CODES.has(code)) {
          toast.error(t(`priceReminder.errors.${code}`))
          return
        }
      }
      const message =
        err instanceof Error ? err.message : t('priceReminder.errors.saveFailed')
      toast.error(message)
    },
  })

  const ratesReady = !!res?.succeeded
  const hasSpotRates = ratesReady && carats.length > 0
  const inputDisabled = !hasSpotRates || createAlertsMutation.isPending
  const saveDisabled =
    !hasSpotRates || !deltaValid || !notificationMethod || createAlertsMutation.isPending

  return {
    isLoading,
    hasSpotRates,
    watchSummary,
    deltaInput,
    setDeltaInput,
    inputDisabled,
    saveDisabled,
    createAlertsMutation,
    pushOn,
    setPushOn,
    whatsappOn,
    setWhatsappOn,
    emailOn,
    setEmailOn,
    notificationMethod,
  }
}

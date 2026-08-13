import { apiService } from '@/services/api'

export type NotificationPreferences = {
  email_enabled: boolean
  whatsapp_enabled: boolean
  push_enabled: boolean
  updated_at?: string | null
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const data = (await apiService.get('/notifications/preferences/')) as NotificationPreferences & {
    ok?: boolean
  }
  return {
    email_enabled: Boolean(data?.email_enabled),
    whatsapp_enabled: Boolean(data?.whatsapp_enabled),
    push_enabled: Boolean(data?.push_enabled),
    updated_at: data?.updated_at ?? null,
  }
}

export async function patchNotificationPreferences(
  patch: Partial<Pick<NotificationPreferences, 'email_enabled' | 'whatsapp_enabled' | 'push_enabled'>>,
): Promise<NotificationPreferences> {
  const data = (await apiService.patch(
    '/notifications/preferences/',
    patch,
  )) as NotificationPreferences
  return {
    email_enabled: Boolean(data?.email_enabled),
    whatsapp_enabled: Boolean(data?.whatsapp_enabled),
    push_enabled: Boolean(data?.push_enabled),
    updated_at: data?.updated_at ?? null,
  }
}

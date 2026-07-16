import { apiService } from './api'

export type BlacklistMatchHit = {
  originalName: string
  similarityScore: number
}

export type BlacklistCheckResponse = {
  matched: boolean
  matchType: 'exact' | 'fuzzy' | null
  originalName: string | null
  similarityScore: number | null
  normalizedName: string
  matches: BlacklistMatchHit[]
  referenceId?: string
  ok?: boolean
  error?: string
}

export const blacklistScreeningApi = {
  getStats: () =>
    apiService.get<{
      ok: boolean
      totalNames: number
      sampleNames?: string[]
      recentNames?: string[]
      error?: string
    }>('/accounts/blacklist/stats/'),

  checkName: (name: string, turnstileToken?: string) =>
    apiService.post<BlacklistCheckResponse & { ok?: boolean; error?: string; detail?: string }>(
      '/accounts/blacklist/check/',
      {
        name,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      },
    ),
}

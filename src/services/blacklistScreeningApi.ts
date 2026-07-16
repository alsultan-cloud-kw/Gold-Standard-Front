import { apiService } from './api'

export type BlacklistCheckResponse = {
  matched: boolean
  matchType: 'exact' | 'fuzzy' | null
  originalName: string | null
  similarityScore: number | null
  normalizedName: string
}

export const blacklistScreeningApi = {
  getStats: () =>
    apiService.get<{ ok: boolean; totalNames: number; error?: string }>('/accounts/blacklist/stats/'),

  checkName: (name: string) =>
    apiService.post<BlacklistCheckResponse & { ok: boolean; error?: string }>(
      '/accounts/blacklist/check/',
      { name },
    ),
}

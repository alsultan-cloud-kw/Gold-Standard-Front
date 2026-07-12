import type { NavigateFunction } from 'react-router-dom'
import type { User } from '@/types'
import { resolvePostAuthPath } from '@/utils/authRedirect'

/** Navigate after auth — always uses replace to avoid back-button loops. */
export function completeAuthNavigation(
  navigate: NavigateFunction,
  user: User | null | undefined,
  nextRaw?: string | null,
) {
  navigate(resolvePostAuthPath(user, nextRaw), { replace: true })
}

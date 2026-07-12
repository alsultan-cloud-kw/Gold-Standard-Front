import { toast } from 'sonner'

export const LOGIN_SUCCESS_PENDING_KEY = 'gs_login_success_pending'

type AuthToastCopy = {
  title: string
  body?: string
}

/** Call when JWT is stored — toast fires on the destination route (after redirect). */
export function markLoginSuccessPending() {
  try {
    sessionStorage.setItem(LOGIN_SUCCESS_PENDING_KEY, '1')
  } catch {
    // ignore private browsing / storage blocks
  }
}

function authToastPosition(): 'top-center' | 'bottom-center' {
  if (typeof window === 'undefined') return 'top-center'
  return window.matchMedia('(max-width: 1023px)').matches ? 'top-center' : 'top-center'
}

/** Branded success toast for email, phone, and OAuth sign-in. */
export function showLoginSuccessToast(copy: AuthToastCopy) {
  toast.success(copy.title, {
    id: 'gs-login-success',
    description: copy.body,
    duration: 4500,
    position: authToastPosition(),
    className: 'gs-toast gs-toast-success',
  })
}

export function consumeLoginSuccessPending(): boolean {
  try {
    if (sessionStorage.getItem(LOGIN_SUCCESS_PENDING_KEY) !== '1') return false
    sessionStorage.removeItem(LOGIN_SUCCESS_PENDING_KEY)
    return true
  } catch {
    return false
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '@/i18n'

type Props = {
  children: ReactNode
  /** Where "try again" sends the user (defaults to dashboard). */
  resetHref?: string
}

type State = {
  error: Error | null
}

/**
 * Catches render errors inside protected/account routes so one bad tab
 * does not white-screen the whole storefront shell (navbar/footer stay up).
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render error:', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  private handleGoBack = () => {
    const href = this.props.resetHref ?? '/dashboard'
    window.location.assign(href)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page-shell page-section">
          <div className="dashboard-panel mx-auto max-w-lg text-center">
            <h2 className="dashboard-panel__title">
              {i18n.t('common.errorBoundaryTitle', { defaultValue: 'Something went wrong' })}
            </h2>
            <p className="dashboard-panel__subtitle">
              {i18n.t('common.errorBoundaryBody', {
                defaultValue: 'This page hit an unexpected error. You can retry or return to your dashboard.',
              })}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={this.handleRetry} className="dashboard-primary-btn">
                {i18n.t('common.tryAgain', { defaultValue: 'Try again' })}
              </button>
              <button type="button" onClick={this.handleGoBack} className="dashboard-secondary-btn">
                {i18n.t('nav.dashboard', { defaultValue: 'Dashboard' })}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

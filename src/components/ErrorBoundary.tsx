import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-950 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs break-words">
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-purple-600 text-white px-5 py-2.5 text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

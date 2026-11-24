import { useState } from 'react'
import { useAppStore } from '@/store/app'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

type Mode = 'signin' | 'signup'

export function Auth() {
  const { loadDemoData } = useAppStore()
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, fullName)
        toast('Account created! Check your email to verify.', { type: 'success' })
      }
    } catch (err: any) {
      toast(err.message ?? 'Something went wrong', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm mb-4">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="text-primary-200 mt-1 text-sm">Track your spending, simply.</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
          <div className="flex gap-1 mb-6 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>

        {/* Demo Mode */}
        <div className="mt-6 text-center">
          <p className="text-primary-200 text-sm mb-3">Just exploring?</p>
          <Button
            variant="ghost"
            onClick={loadDemoData}
            className="text-white hover:bg-white/10"
          >
            Try Demo Mode
          </Button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

type Mode = 'signin' | 'signup' | 'forgot'

export function Auth() {
  const { loadDemoData } = useAppStore()
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/expenses/reset-password`,
        })
        if (error) throw error
        toast('Password reset email sent — check your inbox', { type: 'success' })
        setMode('signin')
        return
      }
      if (mode === 'signin') {
        await signIn(email, password, rememberMe)
      } else {
        await signUp(email, password, fullName)
        toast('Account created! Check your email to confirm before signing in.', { type: 'success' })
        setMode('signin')
      }
    } catch (err: any) {
      toast(err.message ?? 'Something went wrong', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f3d] via-[#132040] to-[#0a1628] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm mb-4 p-2">
            <img src="./logo.webp" alt="Expenses" className="w-full h-full object-contain rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="text-blue-200/70 mt-1 text-sm">Track your spending, simply.</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
          {mode === 'forgot' ? (
            <>
              <button onClick={() => setMode('signin')} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
                ← Back to sign in
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">Forgot password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
                <Button type="submit" size="lg" loading={loading} className="w-full mt-1 gap-2">
                  <Mail size={16} />
                  Send reset link
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Tab toggle */}
              <div className="flex gap-1 mb-5 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                {(['signin', 'signup'] as const).map((m) => (
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
                    className={inputClass}
                  />
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="email"
                  className={inputClass}
                />

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Create password (min 8 chars)' : 'Password'}
                    required
                    minLength={mode === 'signup' ? 8 : undefined}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {mode === 'signin' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => setRememberMe(!rememberMe)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          rememberMe
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {rememberMe && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Demo link */}
        <div className="mt-6 text-center">
          <p className="text-blue-200/60 text-xs mb-3">Not ready to sign up?</p>
          <button
            onClick={loadDemoData}
            className="text-sm font-medium text-white/80 hover:text-white underline underline-offset-2 transition-colors"
          >
            Try the demo — no account needed
          </button>
        </div>
      </div>
    </div>
  )
}

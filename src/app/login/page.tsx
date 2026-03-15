'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const router = useRouter()

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/comms')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/comms`,
        },
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        setSubmitted(true)
        setEmail('')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-shore-sand flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-driftwood/10 p-8">
          <h1 className="font-mono text-2xl font-bold text-deep-ocean mb-2 tracking-wider">
            Shorestack Comms
          </h1>
          <p className="text-driftwood text-sm mb-8">Internal messaging for your team</p>

          {submitted ? (
            <div className="bg-seafoam/10 border border-seafoam/30 rounded-md p-4 text-center">
              <p className="text-deep-ocean font-sans text-sm">
                Check your email for a login link. It will expire in 24 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setMode('password') }}
                className="text-driftwood text-xs font-mono mt-3 hover:text-deep-slate transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block font-mono text-xs text-deep-slate uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-driftwood/20 rounded-md bg-shore-sand text-deep-slate placeholder-driftwood/50 focus:outline-none focus:ring-2 focus:ring-seafoam/50 focus:border-seafoam"
                />
              </div>

              <div>
                <label htmlFor="password" className="block font-mono text-xs text-deep-slate uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2 border border-driftwood/20 rounded-md bg-shore-sand text-deep-slate placeholder-driftwood/50 focus:outline-none focus:ring-2 focus:ring-seafoam/50 focus:border-seafoam"
                />
              </div>

              {error && (
                <div className="bg-sunset-coral/10 border border-sunset-coral/30 rounded-md p-3">
                  <p className="text-sunset-coral text-sm font-sans">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-deep-ocean text-shore-sand font-mono text-sm py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity uppercase tracking-wider"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setError(null); setMode('magic') }}
                className="w-full text-driftwood text-xs font-mono hover:text-deep-slate transition-colors"
              >
                Use magic link instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block font-mono text-xs text-deep-slate uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-driftwood/20 rounded-md bg-shore-sand text-deep-slate placeholder-driftwood/50 focus:outline-none focus:ring-2 focus:ring-seafoam/50 focus:border-seafoam"
                />
              </div>

              {error && (
                <div className="bg-sunset-coral/10 border border-sunset-coral/30 rounded-md p-3">
                  <p className="text-sunset-coral text-sm font-sans">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-deep-ocean text-shore-sand font-mono text-sm py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity uppercase tracking-wider"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>

              <button
                type="button"
                onClick={() => { setError(null); setMode('password') }}
                className="w-full text-driftwood text-xs font-mono hover:text-deep-slate transition-colors"
              >
                Use password instead
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

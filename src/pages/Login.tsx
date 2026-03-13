import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, Scissors, Sparkles } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type LoginProps = {
  session: Session | null
}

export function Login({ session }: LoginProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [magicSubmitting, setMagicSubmitting] = useState(false)
  const [oauthSubmitting, setOauthSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function getAuthRedirectUrl() {
    const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`
    return `${window.location.origin}${pathname}`
  }

  useEffect(() => {
    if (session) {
      const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    }
  }, [location.state, navigate, session])

  useEffect(() => {
    if (cooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  async function handleEmailPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email || !password) {
      setError('Συμπληρωσε email και password.')
      return
    }

    setAuthSubmitting(true)
    setError(null)
    setMessage(null)

    if (authMode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setAuthSubmitting(false)
        return
      }

      setMessage('Συνδεθηκες επιτυχως.')
      setAuthSubmitting(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setAuthSubmitting(false)
      return
    }

    setMessage('Ο λογαριασμος δημιουργηθηκε. Τωρα μπορεις να κανεις Sign in.')
    setAuthMode('signin')
    setAuthSubmitting(false)
  }

  async function handleMagicLink() {
    if (cooldown > 0 || !email) {
      if (!email) {
        setError('Συμπληρωσε email για magic link.')
      }
      return
    }

    setMagicSubmitting(true)
    setError(null)
    setMessage(null)

    const redirectTo = getAuthRedirectUrl()
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (signInError) {
      if (signInError.message.toLowerCase().includes('rate limit')) {
        setError('Εφτασες το οριο αποστολων email. Περιμενε λιγο και ξαναδοκιμασε.')
      } else {
        setError(signInError.message)
      }
      setMagicSubmitting(false)
      return
    }

    setMessage('Magic link sent. Check your inbox and open it on this device.')
    setCooldown(60)
    setMagicSubmitting(false)
  }

  async function handleGoogleLogin() {
    setError(null)
    setMessage(null)
    setOauthSubmitting(true)

    const redirectTo = getAuthRedirectUrl()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setOauthSubmitting(false)
      return
    }

    setOauthSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.2),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="rounded-full border border-amber-300/30 bg-amber-300/10 p-3 text-amber-300">
              <Scissors className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Premium Grooming
            </span>
          </div>

          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Barber Booking</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">Reserve your next appointment in under a minute.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Sign in with email and password to manage upcoming visits and lock in an available slot from Tuesday to Saturday.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-1">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={[
                'rounded-xl px-3 py-2 text-sm font-medium transition',
                authMode === 'signin' ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:text-white',
              ].join(' ')}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={[
                'rounded-xl px-3 py-2 text-sm font-medium transition',
                authMode === 'signup' ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:text-white',
              ].join(' ')}
            >
              Sign up
            </button>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleEmailPasswordSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-inner shadow-black/20">
                <Mail className="h-5 w-5 text-amber-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-inner shadow-black/20">
                <Lock className="h-5 w-5 text-amber-300" />
                <input
                  type="password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </label>

            {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
            {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-300/60"
            >
              {authSubmitting
                ? authMode === 'signin'
                  ? 'Signing in...'
                  : 'Creating account...'
                : authMode === 'signin'
                  ? 'Sign in with email'
                  : 'Create account'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={oauthSubmitting || authSubmitting || magicSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-amber-300/45 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-900">G</span>
              {oauthSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={() => void handleMagicLink()}
              disabled={magicSubmitting || cooldown > 0 || authSubmitting || oauthSubmitting}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-amber-300/45 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {magicSubmitting ? 'Sending magic link...' : cooldown > 0 ? `Retry magic link in ${cooldown}s` : 'Send magic link'}
            </button>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            Already authenticated? Head back to the <Link to="/" className="text-amber-300 transition hover:text-amber-200">dashboard</Link>.
          </p>
        </div>
      </div>
    </main>
  )
}
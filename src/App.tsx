import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Dashboard } from './pages/Dashboard'
import { Booking } from './pages/Booking'
import { Login } from './pages/Login'
import { supabase } from './lib/supabase'

type ProtectedRouteProps = {
  session: Session | null
  children: ReactNode
}

function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
          Loading your session...
        </div>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login session={session} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute session={session}>
            {session ? <Dashboard session={session} /> : null}
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute session={session}>
            {session ? <Booking session={session} /> : null}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App

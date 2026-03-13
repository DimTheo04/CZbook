import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Clock3, LogOut, Phone, UserRound } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Appointment, Profile } from '../lib/supabase'

type DashboardProps = {
  session: Session
}

export function Dashboard({ session }: DashboardProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadDashboard()
  }, [session.user.id])

  async function ensureProfile() {
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle<Profile>()

    if (profileError) {
      throw profileError
    }

    if (existingProfile) {
      return existingProfile
    }

    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: session.user.id,
        full_name: session.user.user_metadata.full_name ?? null,
        phone_number: null,
      })
      .select('*')
      .single<Profile>()

    if (insertError) {
      throw insertError
    }

    return insertedProfile
  }

  async function loadDashboard() {
    setLoading(true)
    setError(null)

    try {
      const profileRecord = await ensureProfile()
      setProfile(profileRecord)
      setFullName(profileRecord.full_name ?? '')
      setPhoneNumber(profileRecord.phone_number ?? '')

      const { data: appointmentRows, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'booked')
        .order('start_time', { ascending: true })
        .returns<Appointment[]>()

      if (appointmentError) {
        throw appointmentError
      }

      setAppointments(appointmentRows ?? [])
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load your dashboard.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setStatus(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        phone_number: phoneNumber.trim() || null,
      })
      .eq('id', session.user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            full_name: fullName.trim() || null,
            phone_number: phoneNumber.trim() || null,
          }
        : current,
    )
    setStatus('Profile updated.')
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const upcomingAppointments = appointments.filter((appointment) => new Date(appointment.start_time) >= new Date())

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Member lounge</p>
                <h1 className="mt-2 text-3xl font-semibold">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Review your profile, keep your contact details current, and reserve the next available appointment slot with the shop.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/40 hover:text-amber-200"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-8 md:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Signed in</p>
              <p className="mt-3 text-sm text-slate-200">{session.user.email}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Upcoming visits</p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">{upcomingAppointments.length}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Booking hours</p>
              <p className="mt-3 text-sm text-slate-200">Tue-Sat, 09:00-21:00</p>
            </article>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleProfileSave} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Your profile</p>
              <h2 className="mt-2 text-xl font-semibold">Stay ready for confirmations</h2>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Full name</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                  <UserRound className="h-5 w-5 text-amber-300" />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Phone number</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                  <Phone className="h-5 w-5 text-amber-300" />
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="Optional"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </label>
            </div>

            {error ? <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
            {status ? <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{status}</p> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-300/60"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              <Link
                to="/book"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-300/40 hover:text-amber-200"
              >
                Book an appointment
              </Link>
            </div>
          </form>

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Upcoming appointments</p>
                <h2 className="mt-2 text-xl font-semibold">Your schedule</h2>
              </div>
              <CalendarDays className="h-5 w-5 text-amber-300" />
            </div>

            {loading ? <p className="text-sm text-slate-400">Loading appointments...</p> : null}

            {!loading && upcomingAppointments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-5 text-sm text-slate-400">
                No bookings yet. Choose a one-hour slot and we will hold it for you instantly.
              </div>
            ) : null}

            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <article key={appointment.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-sm font-medium text-white">{format(new Date(appointment.start_time), 'EEEE, MMMM d')}</p>
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-amber-300">
                    <Clock3 className="h-4 w-4" />
                    {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
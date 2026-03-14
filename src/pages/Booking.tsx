import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock3, LoaderCircle } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { addHours, endOfDay, format, isEqual, setHours, setMinutes, startOfDay } from 'date-fns'
import { Calendar } from '../components/Calendar'
import { supabase } from '../lib/supabase'
import type { Appointment } from '../lib/supabase'

type BookingProps = {
  session: Session
}

function getNextBookableDate() {
  const candidate = startOfDay(new Date())
  while (candidate.getDay() < 2 || candidate.getDay() > 6) {
    candidate.setDate(candidate.getDate() + 1)
  }
  return new Date(candidate)
}

function buildSlots(selectedDate: Date) {
  const slots: Date[] = []

  for (let hour = 9; hour < 21; hour += 1) {
    const slot = setMinutes(setHours(new Date(selectedDate), hour), 0)
    slots.push(slot)
  }

  return slots
}

export function Booking({ session }: BookingProps) {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(getNextBookableDate)
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const slots = useMemo(() => buildSlots(selectedDate), [selectedDate])

  useEffect(() => {
    void loadAppointments(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    setSelectedSlot(null)
    setMessage(null)
  }, [selectedDate])

  async function loadAppointments(date: Date) {
    setLoading(true)
    setError(null)

    const rangeStart = startOfDay(date).toISOString()
    const rangeEnd = endOfDay(date).toISOString()

    const { data, error: queryError } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'booked')
      .gte('start_time', rangeStart)
      .lt('start_time', rangeEnd)
      .returns<Appointment[]>()

    if (queryError) {
      setError(queryError.message)
      setBookedAppointments([])
      setLoading(false)
      return
    }

    setBookedAppointments(data ?? [])
    setLoading(false)
  }

  function isSlotBooked(slot: Date) {
    return bookedAppointments.some((appointment) => isEqual(new Date(appointment.start_time), slot))
  }

  async function handleConfirmBooking() {
    if (!selectedSlot) {
      setError('Select an available time slot first.')
      return
    }

    if (isSlotBooked(selectedSlot)) {
      setError('This slot is no longer available. Please choose another one.')
      setSelectedSlot(null)
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    const startTime = selectedSlot.toISOString()
    const endTime = addHours(selectedSlot, 1).toISOString()

    const { error: insertError } = await supabase.from('appointments').insert({
      user_id: session.user.id,
      start_time: startTime,
      end_time: endTime,
      status: 'booked',
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setMessage(`Appointment confirmed for ${format(selectedSlot, 'EEEE, MMMM d')} at ${format(selectedSlot, 'HH:mm')}.`)
    setSelectedSlot(null)
    await loadAppointments(selectedDate)
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-zinc-300/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Reserve a chair</p>
              <h1 className="mt-2 text-3xl font-semibold">Select a date and claim an open hour.</h1>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-zinc-300/50 hover:text-white"
            >
              View my bookings
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Available slots</p>
                <h2 className="mt-2 text-xl font-semibold">{format(selectedDate, 'EEEE, MMMM d')}</h2>
              </div>
              <p className="text-sm text-slate-400">Tue-Sat, 09:00-21:00</p>
            </div>

            {error ? <p className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
            {message ? <p className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

            {loading ? (
              <div className="flex min-h-52 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/60">
                <LoaderCircle className="h-6 w-6 animate-spin text-zinc-100" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot) => {
                  const booked = isSlotBooked(slot)
                  const selected = selectedSlot ? isEqual(selectedSlot, slot) : false

                  return (
                    <button
                      key={slot.toISOString()}
                      type="button"
                      onClick={() => {
                        if (booked || submitting) {
                          return
                        }
                        setError(null)
                        setMessage(null)
                        setSelectedSlot(slot)
                      }}
                      disabled={booked || submitting}
                      className={[
                        'rounded-3xl border px-4 py-4 text-left transition',
                        selected && !booked
                          ? 'border-zinc-100 bg-zinc-100/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                          : '',
                        booked
                          ? 'cursor-not-allowed border-white/5 bg-slate-950/70 text-slate-500'
                          : 'border-white/10 bg-slate-900/75 text-white hover:border-zinc-300/50 hover:bg-slate-800',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-zinc-200/40 bg-zinc-200/10 p-2 text-zinc-100">
                          <Clock3 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{format(slot, 'HH:mm')}</p>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            {booked ? 'Booked' : selected ? 'Selected' : 'Available'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-300">
                {selectedSlot
                  ? `Selected slot: ${format(selectedSlot, 'EEEE, MMM d')} at ${format(selectedSlot, 'HH:mm')}`
                  : 'Select a slot above, then confirm your booking.'}
              </p>
              <button
                type="button"
                onClick={() => void handleConfirmBooking()}
                disabled={!selectedSlot || submitting || loading}
                className="mt-3 w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-400/60"
              >
                {submitting ? 'Confirming...' : 'Confirm booking'}
              </button>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
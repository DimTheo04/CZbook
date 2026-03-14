import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CalendarProps = {
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isBookableDate(date: Date) {
  const day = date.getDay()
  return day >= 2 && day <= 6
}

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const today = startOfDay(new Date())
  const [monthAnchor, setMonthAnchor] = React.useState(startOfMonth(selectedDate))

  React.useEffect(() => {
    setMonthAnchor(startOfMonth(selectedDate))
  }, [selectedDate])

  const monthStart = startOfMonth(monthAnchor)
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)

  const days: Date[] = []
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    days.push(cursor)
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Select date</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{format(monthStart, 'MMMM yyyy')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthAnchor((current) => subMonths(current, 1))}
            className="rounded-full border border-white/10 bg-slate-900/80 p-2 text-slate-200 transition hover:border-zinc-200/50 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonthAnchor((current) => addMonths(current, 1))}
            className="rounded-full border border-white/10 bg-slate-900/80 p-2 text-slate-200 transition hover:border-zinc-200/50 hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.3em] text-slate-400">
        {dayLabels.map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date) => {
          const disabled = isBefore(date, today) || !isBookableDate(date)
          const selected = isSameDay(date, selectedDate)
          const currentMonth = isSameMonth(date, monthStart)
          const todayState = isToday(date)

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(startOfDay(date))}
              disabled={disabled}
              className={[
                'aspect-square rounded-2xl border text-sm transition',
                selected
                  ? 'border-zinc-100 bg-zinc-100 text-slate-950 shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                  : 'border-white/5 bg-slate-900/70 text-slate-200 hover:border-zinc-200/40 hover:bg-slate-800',
                !currentMonth && 'text-slate-500',
                disabled && 'cursor-not-allowed border-white/5 bg-slate-950/60 text-slate-600 hover:border-white/5 hover:bg-slate-950/60',
                todayState && !selected && 'border-zinc-300/60',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="flex h-full items-center justify-center">{format(date, 'd')}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

import * as React from 'react'
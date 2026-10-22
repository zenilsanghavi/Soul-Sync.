import React, { useEffect, useMemo, useState } from 'react';
import { AccountLayout } from '../components/AccountLayout';
import { MoodPicker, moodIcons } from '../components/MoodPicker';
import { FormAlert } from '../components/AuthLayout';
import { wellbeingService, moodLabels, type MoodEntry, type MoodValue } from '../services/wellbeingService';

type Range = 7 | 30;

interface DayPoint {
  key: string;
  date: Date;
  average: number | null;
  count: number;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// One point per calendar day in the range, averaging that day's check-ins
const buildDays = (entries: MoodEntry[], range: Range): DayPoint[] => {
  const byDay = new Map<string, number[]>();
  for (const entry of entries) {
    const key = dayKey(new Date(entry.created_at));
    byDay.set(key, [...(byDay.get(key) ?? []), entry.mood]);
  }

  const days: DayPoint[] = [];
  for (let offset = range - 1; offset >= 0; offset--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const values = byDay.get(dayKey(date)) ?? [];
    days.push({
      key: dayKey(date),
      date,
      average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
      count: values.length,
    });
  }
  return days;
};

const labelFor = (value: number) => moodLabels[Math.min(5, Math.max(1, Math.round(value))) as MoodValue];

export const MoodPage: React.FC = () => {
  const [range, setRange] = useState<Range>(7);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayMood, setTodayMood] = useState<MoodValue | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const load = async () => {
    // Always fetch 30 days so switching the range doesn't refetch
    setEntries(await wellbeingService.getMoods(30));
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCheckIn = async (mood: MoodValue) => {
    setTodayMood(mood);
    const { error } = await wellbeingService.addMood(mood);
    if (error) {
      setNotice({ tone: 'error', text: `Couldn't save your check-in: ${error}` });
      setTodayMood(null);
      return;
    }
    setNotice({ tone: 'success', text: `Logged: ${moodLabels[mood].toLowerCase()}. Thanks for checking in.` });
    load();
  };

  const days = useMemo(() => buildDays(entries, range), [entries, range]);
  const inRange = useMemo(() => {
    const since = days[0].date;
    return entries.filter(e => new Date(e.created_at) >= since);
  }, [entries, days]);

  const average = inRange.length ? inRange.reduce((sum, e) => sum + e.mood, 0) / inRange.length : null;
  const recent = [...inRange].reverse().slice(0, 8);
  const showEveryLabel = range === 7;

  return (
    <AccountLayout title="Mood" description="A gentle record of how you've been feeling.">
      <div className="space-y-6">
        <section className="card p-6" aria-labelledby="checkin-title">
          <h2 id="checkin-title" className="font-sans text-base font-semibold">How are you feeling right now?</h2>
          <p className="mt-1 mb-4 text-sm text-ink-muted">Check in as often as you like. Only you can see this.</p>
          <MoodPicker value={todayMood} onSelect={handleCheckIn} />
          {notice && <div className="mt-4"><FormAlert tone={notice.tone}>{notice.text}</FormAlert></div>}
        </section>

        {/* Range filter: one row, above everything it scopes */}
        <div className="flex gap-2" role="group" aria-label="Time range">
          {([7, 30] as Range[]).map(value => (
            <button
              key={value}
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
                range === value ? 'bg-brand-600 text-white' : 'border border-line bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              Last {value} days
            </button>
          ))}
        </div>

        <section className={`card p-6 transition-opacity duration-200 ${isLoading ? 'opacity-60' : ''}`} aria-labelledby="mood-chart-title" aria-busy={isLoading}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="mood-chart-title" className="font-sans text-base font-semibold">Average mood by day</h2>
              <p className="text-sm text-ink-muted">1 = very low, 5 = great</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-subtle">Average, last {range} days</p>
              {average === null ? (
                <p className="font-sans text-5xl font-semibold text-ink-subtle">–</p>
              ) : (
                <p className="font-sans text-5xl font-semibold text-ink">
                  {average.toFixed(1)}
                  <span className="ml-2 align-middle text-base font-medium text-ink-muted">{labelFor(average)}</span>
                </p>
              )}
              <p className="text-xs text-ink-subtle">{inRange.length} check-in{inRange.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          {inRange.length === 0 && !isLoading ? (
            <p className="mt-8 rounded-xl bg-canvas px-4 py-10 text-center text-ink-muted">
              No check-ins in this period yet. Pick a face above to log how you feel.
            </p>
          ) : (
            <div className="mt-8 flex gap-3">
              {/* Y axis: mood levels */}
              <div className="relative h-48 w-3 text-right text-[11px] tabular-nums text-ink-subtle" aria-hidden="true">
                {[5, 4, 3, 2, 1].map(level => (
                  <span key={level} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(level / 5) * 100}%` }}>
                    {level}
                  </span>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <div className="relative h-48">
                  {/* Hairline gridlines at each mood level */}
                  {[5, 4, 3, 2, 1].map(level => (
                    <div key={level} className="absolute inset-x-0 h-px bg-line" style={{ bottom: `${(level / 5) * 100}%` }} aria-hidden="true" />
                  ))}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-ink-subtle/40" aria-hidden="true" />

                  <ul className="absolute inset-0 flex items-end" aria-label="Average mood per day">
                    {days.map(day => {
                      const dateLabel = day.date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
                      const isHovered = hovered === day.key;
                      return (
                        <li
                          key={day.key}
                          className="relative flex h-full flex-1 items-end justify-center outline-none"
                          tabIndex={day.average === null ? -1 : 0}
                          onPointerEnter={() => setHovered(day.key)}
                          onPointerLeave={() => setHovered(null)}
                          onFocus={() => setHovered(day.key)}
                          onBlur={() => setHovered(null)}
                          aria-label={day.average === null ? `${dateLabel}: no check-in` : `${dateLabel}: ${day.average.toFixed(1)}, ${labelFor(day.average)}, ${day.count} check-in${day.count === 1 ? '' : 's'}`}
                        >
                          {day.average !== null && (
                            <span
                              className={`w-full max-w-[24px] rounded-t-[4px] transition-opacity duration-150 ${hovered && !isHovered ? 'opacity-50' : ''}`}
                              style={{ height: `${(day.average / 5) * 100}%`, backgroundColor: 'rgb(var(--chart-mood))', marginInline: '1px' }}
                            />
                          )}

                          {isHovered && day.average !== null && (
                            <span role="tooltip" className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 text-left shadow-soft">
                              <span className="block text-sm font-semibold text-ink">{day.average.toFixed(1)} · {labelFor(day.average)}</span>
                              <span className="block text-xs text-ink-muted">{dateLabel} · {day.count} check-in{day.count === 1 ? '' : 's'}</span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* X axis: dates */}
                <div className="mt-2 flex text-[11px] text-ink-subtle" aria-hidden="true">
                  {days.map((day, index) => (
                    <span key={day.key} className="flex-1 text-center">
                      {showEveryLabel
                        ? day.date.toLocaleDateString([], { weekday: 'short' })
                        : index % 5 === 0 || index === days.length - 1
                          ? day.date.toLocaleDateString([], { day: 'numeric', month: 'short' })
                          : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table view: the same data without needing the chart */}
          {inRange.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-brand-700">Show as table</summary>
              <table className="mt-3 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-muted">
                    <th className="py-2 font-medium">Day</th>
                    <th className="py-2 font-medium">Average</th>
                    <th className="py-2 font-medium">Check-ins</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {days.filter(d => d.average !== null).map(day => (
                    <tr key={day.key} className="border-b border-line/60">
                      <td className="py-2">{day.date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="py-2">{day.average!.toFixed(1)} ({labelFor(day.average!)})</td>
                      <td className="py-2">{day.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </section>

        {recent.length > 0 && (
          <section className="card p-6" aria-labelledby="recent-title">
            <h2 id="recent-title" className="font-sans text-base font-semibold">Recent check-ins</h2>
            <ul className="mt-4 divide-y divide-line">
              {recent.map(entry => {
                const Icon = moodIcons[entry.mood];
                return (
                  <li key={entry.id} className="flex items-center gap-3 py-3">
                    <Icon className="h-5 w-5 text-ink-muted" aria-hidden="true" />
                    <span className="flex-1 text-sm font-medium text-ink">{moodLabels[entry.mood]}</span>
                    <span className="text-xs text-ink-subtle">
                      {new Date(entry.created_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </AccountLayout>
  );
};

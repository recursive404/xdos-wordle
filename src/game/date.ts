export function getEtDateString(date: Date = new Date()): string {
  // Produces `YYYY-MM-DD` in America/New_York without pulling in a timezone library.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) throw new Error(`Invalid date string: ${ymd}`)
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

export function daysSinceEpoch(ymd: string): number {
  const { y, m, d } = parseYmd(ymd)
  // Treat ymd as a civil date (not a local time).
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

export function daysBetween(startYmd: string, endYmd: string): number {
  return daysSinceEpoch(endYmd) - daysSinceEpoch(startYmd)
}

export function ymdFromDaysSinceEpoch(days: number): string {
  const d = new Date(days * 86_400_000)
  // Format as UTC civil date.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function addDays(ymd: string, deltaDays: number): string {
  return ymdFromDaysSinceEpoch(daysSinceEpoch(ymd) + deltaDays)
}

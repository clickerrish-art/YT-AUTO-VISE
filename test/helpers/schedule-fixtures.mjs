const VALID_WEEKDAYS = new Set(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]);

/** Return a stable future local-calendar date for time-sensitive API fixtures. */
export function futureScheduleDate(weekday, weeksAhead = 1) {
  if (!VALID_WEEKDAYS.has(weekday)) throw new Error("weekday must be a full English weekday name");
  if (!Number.isInteger(weeksAhead) || weeksAhead < 1 || weeksAhead > 520) throw new Error("weeksAhead must be an integer from 1 to 520");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const firstCandidate = new Date(Date.UTC(year, month - 1, day + weeksAhead * 7));
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(firstCandidate.getTime() + offset * 86_400_000);
    if (new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(candidate) === weekday) return candidate.toISOString().slice(0, 10);
  }
  throw new Error("Could not calculate a future fixture date for " + weekday);
}

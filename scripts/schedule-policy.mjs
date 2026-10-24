export const DEFAULT_SCHEDULE_TIMEZONE = "Africa/Johannesburg";
export const DEFAULT_MIN_SPACING_HOURS = 72;

const ACTIVE_STATUSES = new Set(["scheduled", "published"]);

function localDateKey(timestamp, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(timestamp));
}

function asTimestamp(value, label) {
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} must be a valid ISO timestamp or epoch milliseconds`);
  return timestamp;
}

/**
 * Validates an intended publication slot against every existing scheduled/published item.
 * Compare instants for spacing and IANA-local calendar dates for same-day collisions.
 */
export function validatePublicationSlot(proposed, existingItems = [], {
  timeZone = DEFAULT_SCHEDULE_TIMEZONE,
  minSpacingHours = DEFAULT_MIN_SPACING_HOURS
} = {}) {
  if (!proposed || typeof proposed !== "object") throw new Error("proposed slot is required");
  if (!Number.isFinite(minSpacingHours) || minSpacingHours < 0) throw new Error("minSpacingHours must be a non-negative number");
  // Fail early if the runtime does not recognize the configured IANA timezone.
  new Intl.DateTimeFormat("en", { timeZone }).format(new Date(0));

  const proposedAt = asTimestamp(proposed.scheduledAt, "proposed.scheduledAt");
  const proposedId = proposed.id;
  const errors = [];
  const active = existingItems.filter(item => ACTIVE_STATUSES.has(String(item?.status ?? "").toLowerCase()));
  const ids = new Set();
  const resolved = [];

  for (const item of active) {
    const id = item.id ?? "(unknown)";
    if (typeof item.id !== "string" || !item.id.trim()) errors.push("existing scheduled/published items need stable non-empty IDs");
    else if (ids.has(item.id)) errors.push(`duplicate active job ID: ${item.id}`);
    else ids.add(item.id);

    const status = String(item.status ?? "").toLowerCase();
    const timeValue = status === "published" ? (item.publishedAt ?? item.actualPublishedAt) : item.scheduledAt;
    if (timeValue === undefined || timeValue === null || timeValue === "") {
      errors.push(status === "published"
        ? `active item ${id} is missing publishedAt (actual publication timestamp)`
        : `active item ${id} is missing scheduledAt`);
      continue;
    }
    let timestamp;
    try {
      timestamp = asTimestamp(timeValue, status === "published" ? `item ${id}.publishedAt` : `item ${id}.scheduledAt`);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    resolved.push({ item, timestamp });
  }

  // Refuse to proceed if the existing schedule is already inconsistent. Otherwise a
  // new distant slot could appear valid while two older queue entries collide.
  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const first = resolved[i], second = resolved[j];
      const firstId = first.item.id ?? "(unknown)", secondId = second.item.id ?? "(unknown)";
      if (localDateKey(first.timestamp, timeZone) === localDateKey(second.timestamp, timeZone)) {
        errors.push(`existing publication date collision between ${firstId} and ${secondId} in ${timeZone}`);
      }
      const gapHours = Math.abs(first.timestamp - second.timestamp) / 3_600_000;
      if (gapHours < minSpacingHours) {
        errors.push(`existing spacing conflict between ${firstId} and ${secondId}: ${gapHours} hours is below the ${minSpacingHours}-hour minimum`);
      }
    }
  }

  for (const { item, timestamp } of resolved) {
    const id = item.id ?? "(unknown)";
    if (proposedId && item.id === proposedId) errors.push(`duplicate job ID: ${proposedId}`);
    if (localDateKey(timestamp, timeZone) === localDateKey(proposedAt, timeZone)) {
      errors.push(`publication date collision with ${id} in ${timeZone}`);
    }
    const gapHours = Math.abs(proposedAt - timestamp) / 3_600_000;
    if (gapHours < minSpacingHours) {
      errors.push(`spacing conflict with ${id}: ${gapHours} hours is below the ${minSpacingHours}-hour minimum`);
    }
  }
  return { valid: errors.length === 0, errors, proposedAt: new Date(proposedAt).toISOString() };
}

/** Returns actual elapsed-hour gaps between a recurring weekly set of UTC cron slots. */
export function weeklyUtcCronGaps(schedule) {
  const dayNumber = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const slots = schedule.map(slot => {
    const match = typeof slot.cronUtc === "string" && slot.cronUtc.match(/^(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+(\d)$/);
    if (!match) throw new Error(`unsupported UTC cron for ${slot.day ?? "slot"}; expected "minute hour * * day-of-week"`);
    const minute = Number(match[1]), hour = Number(match[2]), day = Number(match[3]);
    if (minute > 59 || hour > 23 || day > 6) throw new Error(`invalid UTC cron fields for ${slot.day ?? "slot"}`);
    if (slot.day && dayNumber[slot.day] !== day) throw new Error(`cron weekday does not match configured day ${slot.day}`);
    return { label: slot.day ?? `day-${day}`, minuteOfWeek: day * 1440 + hour * 60 + minute };
  }).sort((a, b) => a.minuteOfWeek - b.minuteOfWeek);
  if (slots.length < 2) return [];
  return slots.map((slot, index) => {
    const next = slots[(index + 1) % slots.length];
    const minutes = (index === slots.length - 1 ? next.minuteOfWeek + 10080 : next.minuteOfWeek) - slot.minuteOfWeek;
    return { from: slot.label, to: next.label, hours: minutes / 60 };
  });
}
/** Converts a wall-clock time in an IANA timezone to a real instant without assuming a fixed UTC offset. */
export function localDateTimeToIso(date, time = "17:00", timeZone = DEFAULT_SCHEDULE_TIMEZONE) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("date/time must be valid YYYY-MM-DD and HH:mm values");
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  if (new Date(wallClockAsUtc).toISOString().slice(0, 10) !== date) throw new Error("date must be a real calendar date");
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });
  let guess = wallClockAsUtc;
  for (let attempt = 0; attempt < 5; attempt++) {
    const parts = formatter.formatToParts(new Date(guess)).reduce((result, part) => {
      if (part.type !== "literal") result[part.type] = Number(part.value);
      return result;
    }, {});
    const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const next = wallClockAsUtc - (representedAsUtc - guess);
    if (next === guess) break;
    guess = next;
  }
  const actual = formatter.formatToParts(new Date(guess)).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  if (actual.year !== date.slice(0, 4) || actual.month !== date.slice(5, 7) || actual.day !== date.slice(8, 10)
      || actual.hour !== time.slice(0, 2) || actual.minute !== time.slice(3, 5)) {
    throw new Error(`local time ${date} ${time} does not exist in ${timeZone}`);
  }
  return new Date(guess).toISOString();
}


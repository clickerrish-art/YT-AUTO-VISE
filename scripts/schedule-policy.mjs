export const DEFAULT_SCHEDULE_TIMEZONE = "Africa/Johannesburg";
export const DEFAULT_MIN_SPACING_HOURS = 72;

const ACTIVE_STATUSES = new Set(["scheduled", "published", "public", "private", "unlisted", "uploading", "uploading_private", "pending", "pending_upload", "uncertain", "outcome_uncertain", "upload_outcome_uncertain", "recovery_required"]);

function localDateKey(timestamp, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(timestamp));
}

function parseStrictTimestamp(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value !== "string") return NaN;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/);
  if (!match) return NaN;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = "", zone, sign, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  calendar.setUTCHours(hour, minute, second, Number(fraction.padEnd(3, "0")));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day
      || calendar.getUTCHours() !== hour || calendar.getUTCMinutes() !== minute || calendar.getUTCSeconds() !== second) return NaN;
  if (zone !== "Z") {
    const offsetHour = Number(offsetHourText), offsetMinute = Number(offsetMinuteText);
    if (offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) return NaN;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : NaN;
}

function asTimestamp(value, label) {
  const timestamp = parseStrictTimestamp(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} must be a valid ISO timestamp with an explicit timezone or epoch milliseconds`);
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
    const actualStatuses = new Set(["published", "public", "private", "unlisted"]);
    const timeValue = actualStatuses.has(status) ? (item.actualPublishedAt ?? item.publishedAt ?? item.createdAt) : (item.scheduledAt ?? item.createdAt);
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



export const ROLLING_PUBLICATION_FORMATS = Object.freeze(["long_form", "long_form", "short"]);
export const UNCERTAIN_UPLOAD_STATUSES = Object.freeze(["uploading", "uploading_private", "pending", "pending_upload", "uncertain", "outcome_uncertain", "upload_outcome_uncertain", "recovery_required"]);

/**
 * Fail-closed gate for the next actual publication. A queue is not evidence of
 * channel history; callers must independently retrieve public/private/unlisted
 * history and reconcile all pending/uncertain inserts before setting historyVerified.
 */
export function evaluateNextPublication({
  history,
  historyVerified = false,
  pendingAttempts = [],
  scheduledItems = [],
  proposedAt,
  jobId,
  format,
  timeZone = DEFAULT_SCHEDULE_TIMEZONE,
  minSpacingHours = DEFAULT_MIN_SPACING_HOURS
} = {}) {
  const errors = [];
  if (historyVerified !== true) errors.push("complete channel history has not been independently verified");
  if (!Array.isArray(history)) errors.push("channel history must be an array");
  if (!Array.isArray(pendingAttempts)) errors.push("pendingAttempts must be an array");
  if (!Array.isArray(scheduledItems)) errors.push("scheduledItems must be an array");
  if (errors.length) return { valid: false, errors, expectedFormat: null };
  const normalizedHistory = history.map((item, index) => {
    if (!item || typeof item !== "object" || !item.id) {
      errors.push(`history item ${index} is missing a stable remote ID`);
      return null;
    }
    const status = String(item.status ?? item.visibility ?? "").toLowerCase();
    const timestamp = item.actualPublishedAt ?? item.publishedAt ?? item.createdAt;
    const parsedTimestamp = parseStrictTimestamp(timestamp);
    if (!Number.isFinite(parsedTimestamp)) {
      errors.push(`history item ${item.id} is missing a verified actual ISO timestamp with timezone`);
      return null;
    }
    return { id: String(item.id), status, timestamp: parsedTimestamp, format: item.format ?? item.contentType ?? null };
  }).filter(Boolean);
  for (const attempt of pendingAttempts) {
    const status = String(attempt?.status ?? "").toLowerCase();
    if (!attempt?.jobId || UNCERTAIN_UPLOAD_STATUSES.includes(status)) {
      errors.push(`upload attempt ${attempt?.jobId ?? "(unknown)"} has an unresolved/uncertain outcome and must be reconciled`);
    }
  }
  // Completed ledger attempts are evidence to reconcile, not future scheduled slots.
  // The authenticated remote history is authoritative for completed publications; counting
  // a verified ledger receipt again would compare the publication with itself and falsely
  // block every subsequent upload. Only explicit future scheduling states belong here.
  const scheduledAttemptStatuses = new Set(["scheduled", "queued_for_publication", "pending_schedule"]);
  const allPlanned = [
    ...scheduledItems,
    ...pendingAttempts.filter(a => scheduledAttemptStatuses.has(String(a?.status ?? "").toLowerCase()))
  ];
  const ids = new Set();
  for (const item of [...allPlanned, ...history]) {
    if (item?.id && ids.has(String(item.id))) errors.push(`duplicate stable job/remote ID: ${item.id}`);
    if (item?.id) ids.add(String(item.id));
  }
  if (!jobId || typeof jobId !== "string" || !jobId.trim()) errors.push("proposed publication requires a stable job ID");
  const proposedTimestamp = parseStrictTimestamp(proposedAt);
  if (!Number.isFinite(proposedTimestamp)) errors.push("proposedAt must be a valid ISO timestamp with explicit timezone");
  const actualSorted = normalizedHistory.sort((a, b) => a.timestamp - b.timestamp);
  const latestActual = actualSorted.at(-1);
  const expectedFormat = ROLLING_PUBLICATION_FORMATS[actualSorted.length % ROLLING_PUBLICATION_FORMATS.length];
  if (format !== expectedFormat) errors.push(`next format must be ${expectedFormat} in the rolling long_form, long_form, short cycle`);
  const candidate = { id: jobId, status: "scheduled", scheduledAt: proposedAt };
  // Historical records determine cycle progression and duplicate detection, but spacing
  // is enforced from the latest actual publication forward. Past pre-policy intervals
  // cannot be changed retroactively.
  const latestRecord = latestActual ? history.find(item => String(item.id) === latestActual.id) : null;
  const existing = [
    ...(latestActual ? [{
      id: latestActual.id,
      status: String(latestRecord?.status ?? latestRecord?.visibility ?? "published").toLowerCase(),
      publishedAt: new Date(latestActual.timestamp).toISOString()
    }] : []),
    ...scheduledItems,
    ...pendingAttempts
      .filter(item => scheduledAttemptStatuses.has(String(item?.status ?? "").toLowerCase()))
      .map(item => ({
        id: item?.jobId,
        status: String(item?.status ?? "").toLowerCase(),
        scheduledAt: item?.scheduledAt ?? item?.createdAt
      }))
  ];
  if (Number.isFinite(proposedTimestamp)) {
    const spacing = validatePublicationSlot(candidate, existing, { timeZone, minSpacingHours });
    errors.push(...spacing.errors);
    if (latestActual && (proposedTimestamp - latestActual.timestamp) / 3_600_000 < minSpacingHours) {
      errors.push("proposed publication is less than 72 elapsed hours after the latest actual channel publication");
    }
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)], expectedFormat, latestActualAt: latestActual ? new Date(latestActual.timestamp).toISOString() : null };
}

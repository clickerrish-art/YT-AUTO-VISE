export const APPROVED_SELAR_URL = "https://selar.com/0u19v8u99l";
export const DRAFT_SCHEDULE_TIMEZONE = "Africa/Johannesburg";
export const MINIMUM_PUBLICATION_SPACING_HOURS = 72;

const inactiveJobStates = new Set(["CANCELLED", "REJECTED"]);
const inactiveQueueStatuses = new Set(["cancelled", "canceled", "deleted", "rejected", "skipped"]);
const allowedSlots = new Map([["Tuesday", "long_form"], ["Saturday", "short"]]);

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function localDateTimeToIso(date, time = "17:00") {
  if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Scheduled date/time is invalid");
  // The repository's authoritative weekly plan specifies Africa/Johannesburg,
  // which is UTC+02:00 year-round. Reject if runtime timezone formatting disagrees.
  const instant = new Date(date + "T" + time + ":00+02:00");
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DRAFT_SCHEDULE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });
  const parts = formatter.formatToParts(instant).reduce((out, part) => {
    if (part.type !== "literal") out[part.type] = part.value;
    return out;
  }, {});
  if (parts.year + "-" + parts.month + "-" + parts.day !== date || parts.hour + ":" + parts.minute !== time) {
    throw new Error("Scheduled local time does not resolve exactly in Africa/Johannesburg");
  }
  return instant.toISOString();
}

export function safeDraftItem(item, now = new Date().toISOString()) {
  if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Draft must be an object");
  const id = String(item.id ?? "").trim();
  const title = String(item.title ?? "").trim();
  const topic = String(item.topic ?? "").trim();
  const contentType = item.contentType;
  const scheduledDay = item.scheduledDay;
  const scheduledDate = String(item.scheduledDate ?? "").trim();
  if (!validDate(scheduledDate)) throw new Error("Scheduled date must be a real YYYY-MM-DD date");
  const actualDay = new Date(scheduledDate + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  if (actualDay !== scheduledDay) throw new Error("Scheduled date weekday must match production day");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$/.test(id)) throw new Error("ID must be 3–80 safe characters");
  if (!title || title.length > 100) throw new Error("Title is required and must be at most 100 characters");
  if (!topic || topic.length > 300) throw new Error("Topic is required and must be at most 300 characters");
  if (allowedSlots.get(scheduledDay) !== contentType) throw new Error("Scheduled day format does not match the authoritative draft-preparation schedule");
  const scheduledAt = localDateTimeToIso(scheduledDate);
  if (item.productUrl !== APPROVED_SELAR_URL) throw new Error("Destination must be the exact approved Selar URL");
  for (const key of ["rightsConfirmed", "complianceReviewed", "approvedForPrivateUpload", "humanApproved"]) {
    if (item[key] === true) throw new Error("Draft editing cannot grant rights or review approval");
  }
  return {
    id, title, topic, contentType, scheduledDay, scheduledDate, scheduledAt,
    reservationType: "SCHEDULED_SLOT", productUrl: APPROVED_SELAR_URL,
    status: "DRAFT_REVIEW_REQUIRED", updatedAt: now
  };
}

function reservationSlots(state, excludeItemId) {
  const slots = [];
  const queueDates = new Map();
  for (const item of state.queueItems ?? []) {
    const status = String(item?.status ?? "").toLowerCase();
    if (item?.id === excludeItemId || item?.reservationType !== "SCHEDULED_SLOT" || inactiveQueueStatuses.has(status)) continue;
    if (status === "published") {
      slots.push({ id: item.id, status, scheduledAt: item.publishedAt ?? item.actualPublishedAt });
    } else {
      slots.push({
        id: item.id, status: "scheduled",
        scheduledAt: item.scheduledAt ?? (item.scheduledDate ? localDateTimeToIso(item.scheduledDate) : undefined)
      });
    }
    queueDates.set(item.id, item.scheduledDate);
  }
  const represented = new Set();
  for (const job of state.jobs ?? []) {
    const date = job?.scheduledSlot?.date;
    if (job?.kind !== "CONTENT_PRODUCTION" || inactiveJobStates.has(String(job.state ?? "").toUpperCase()) ||
        !date || job.idempotencyKey === "draft:" + excludeItemId) continue;
    const match = /^draft:(.+)$/.exec(String(job.idempotencyKey ?? ""));
    const queueItemId = match?.[1];
    if (queueItemId && queueDates.get(queueItemId) === date && !represented.has(queueItemId)) {
      represented.add(queueItemId);
      continue;
    }
    slots.push({ id: "job-" + job.id, status: "scheduled", scheduledAt: localDateTimeToIso(date) });
  }
  return slots;
}

function localDateKey(timestamp) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DRAFT_SCHEDULE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(timestamp));
}

export function validateReservedPublicationSlot(proposed, state, excludeItemId = null, now = Date.now()) {
  const proposedAt = typeof proposed?.scheduledAt === "string" ? Date.parse(proposed.scheduledAt) : NaN;
  if (!Number.isFinite(proposedAt)) return { valid: false, errors: ["proposed.scheduledAt must be a valid ISO timestamp"] };
  if (proposedAt <= now) return { valid: false, errors: ["proposed schedule slot must be in the future"] };
  let slots;
  try { slots = reservationSlots(state, excludeItemId); }
  catch (error) { return { valid: false, errors: [error.message] }; }
  const errors = [];
  const resolved = [];
  const ids = new Set();
  for (const item of slots) {
    if (typeof item.id !== "string" || !item.id.trim()) { errors.push("existing scheduled/published items need stable non-empty IDs"); continue; }
    if (ids.has(item.id)) { errors.push("duplicate active job ID: " + item.id); continue; }
    ids.add(item.id);
    const timestamp = typeof item.scheduledAt === "string" ? Date.parse(item.scheduledAt) : NaN;
    if (!Number.isFinite(timestamp)) { errors.push("active item " + item.id + " is missing a valid actual publication or scheduled timestamp"); continue; }
    resolved.push({ id: item.id, timestamp });
  }
  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const a = resolved[i], b = resolved[j];
      if (localDateKey(a.timestamp) === localDateKey(b.timestamp)) errors.push("existing publication date collision between " + a.id + " and " + b.id + " in " + DRAFT_SCHEDULE_TIMEZONE);
      const gap = Math.abs(a.timestamp - b.timestamp) / 3_600_000;
      if (gap < MINIMUM_PUBLICATION_SPACING_HOURS) errors.push("existing spacing conflict between " + a.id + " and " + b.id + ": " + gap + " hours is below the 72-hour minimum");
    }
  }
  for (const item of resolved) {
    if (item.id === proposed.id) errors.push("duplicate job ID: " + proposed.id);
    if (localDateKey(item.timestamp) === localDateKey(proposedAt)) errors.push("publication date collision with " + item.id + " in " + DRAFT_SCHEDULE_TIMEZONE);
    const gap = Math.abs(proposedAt - item.timestamp) / 3_600_000;
    if (gap < MINIMUM_PUBLICATION_SPACING_HOURS) errors.push("spacing conflict with " + item.id + ": " + gap + " hours is below the 72-hour minimum");
  }
  return { valid: errors.length === 0, errors, proposedAt: new Date(proposedAt).toISOString() };
}

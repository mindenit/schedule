/**
 * WeakMap-based side caches for per-event derived values.
 *
 * Why WeakMap:
 * - Keys are Schedule object references. When the store replaces allEvents on a
 *   new network response, the old objects become unreachable and are GC'd
 *   automatically — no manual invalidation needed.
 * - Values are computed once on first access and returned on every subsequent
 *   call, regardless of how many components read the same event in the same
 *   render pass.
 *
 * Timezone bucketing:
 * - Caches are keyed first by the resolved IANA timezone string, then by event
 *   reference. This means changing the timezone produces cache misses and fresh
 *   values without any manual invalidation.
 *
 * Day key is the Unix timestamp (ms) of the event's midnight in the selected
 * timezone — used as a numeric Map key in MonthView so no ISO string allocation
 * is required.
 */

import type { Schedule } from "@mindenit/nurekit"
import { formatInTimeZone, toZonedTime } from "date-fns-tz"
import { uk } from "date-fns/locale"

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function pad2(n: number): string {
	return n < 10 ? `0${n}` : `${n}`
}

/** Returns (or creates) the WeakMap for the given timezone bucket. */
function bucket<V>(map: Map<string, WeakMap<Schedule, V>>, tz: string): WeakMap<Schedule, V> {
	let wm = map.get(tz)
	if (!wm) {
		wm = new WeakMap()
		map.set(tz, wm)
	}
	return wm
}

// ---------------------------------------------------------------------------
// Intl.DateTimeFormat instances cached per timezone.
//
// Using Intl.DateTimeFormat.formatToParts to extract Y/M/D in the target
// timezone is 5-10× faster than toZonedTime() from date-fns-tz for the
// "give me local year/month/day" question, because it avoids constructing a
// full zoned Date object. The instances are reused across events in the same
// timezone bucket, amortising the construction cost over a full year's events.
// ---------------------------------------------------------------------------

const dtfCache = new Map<string, Intl.DateTimeFormat>()

function getDtf(tz: string): Intl.DateTimeFormat {
	let dtf = dtfCache.get(tz)
	if (!dtf) {
		dtf = new Intl.DateTimeFormat("en-US", {
			timeZone: tz,
			year: "numeric",
			month: "numeric",
			day: "numeric",
		})
		dtfCache.set(tz, dtf)
	}
	return dtf
}

/** Fast local-midnight key via Intl — no full Date object construction per event. */
function localMidnightKey(utcMs: number, tz: string): number {
	const parts = getDtf(tz).formatToParts(utcMs)
	let y = 0,
		m = 0,
		d = 0
	for (const p of parts) {
		if (p.type === "year") y = +p.value
		else if (p.type === "month")
			m = +p.value - 1 // JS months are 0-based
		else if (p.type === "day") d = +p.value
	}
	return new Date(y, m, d).getTime()
}

// ---------------------------------------------------------------------------
// Day key: Unix ms of the event's start-date midnight in the selected timezone
// ---------------------------------------------------------------------------

const dayKeyCache = new Map<string, WeakMap<Schedule, number>>()

export function getEventDayKey(event: Schedule, tz: string): number {
	const wm = bucket(dayKeyCache, tz)
	let key = wm.get(event)
	if (key === undefined) {
		key = localMidnightKey(event.startedAt * 1000, tz)
		wm.set(event, key)
	}
	return key
}

/**
 * Compute the same day-key for an arbitrary Date that `getEventDayKey` produces
 * for events — Unix ms of that date's midnight in the given timezone (local JS
 * time, not UTC). Use this to look up events in the `eventsByDayKey` store map.
 */
export function getDayKey(date: Date, tz: string): number {
	return localMidnightKey(date.getTime(), tz)
}

// ---------------------------------------------------------------------------
// Formatted time range: "HH:mm - HH:mm"
// ---------------------------------------------------------------------------

const timeRangeCache = new Map<string, WeakMap<Schedule, string>>()

export function getEventTimeRange(event: Schedule, tz: string): string {
	const wm = bucket(timeRangeCache, tz)
	let range = wm.get(event)
	if (range === undefined) {
		const start = toZonedTime(new Date(event.startedAt * 1000), tz)
		const end = toZonedTime(new Date(event.endedAt * 1000), tz)
		range = `${pad2(start.getHours())}:${pad2(start.getMinutes())} - ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
		wm.set(event, range)
	}
	return range
}

// ---------------------------------------------------------------------------
// Formatted date string: "d MMMM yyyy" in Ukrainian
// ---------------------------------------------------------------------------

const dateStringCache = new Map<string, WeakMap<Schedule, string>>()

export function getEventDateString(event: Schedule, tz: string): string {
	const wm = bucket(dateStringCache, tz)
	let str = wm.get(event)
	if (str === undefined) {
		str = formatInTimeZone(new Date(event.startedAt * 1000), tz, "d MMMM yyyy", { locale: uk })
		wm.set(event, str)
	}
	return str
}

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

import type { Schedule } from "nurekit"
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
// Day key: Unix ms of the event's start-date midnight in the selected timezone
// ---------------------------------------------------------------------------

const dayKeyCache = new Map<string, WeakMap<Schedule, number>>()

export function getEventDayKey(event: Schedule, tz: string): number {
	const wm = bucket(dayKeyCache, tz)
	let key = wm.get(event)
	if (key === undefined) {
		// Convert the UTC timestamp to a zoned Date, then take its local midnight
		const zonedDate = toZonedTime(new Date(event.startedAt * 1000), tz)
		key = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate()).getTime()
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
	const zonedDate = toZonedTime(date, tz)
	return new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate()).getTime()
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

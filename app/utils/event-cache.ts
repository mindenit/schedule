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
 * Day key is the Unix timestamp (ms) of the event's local midnight — used as
 * a numeric Map key in MonthView so no ISO string allocation is required.
 */

import type { Schedule } from "nurekit"
import { format } from "date-fns"
import { uk } from "date-fns/locale"

// ---------------------------------------------------------------------------
// Day key: Unix ms of the local midnight of the event's start date
// ---------------------------------------------------------------------------

const dayKeyCache = new WeakMap<Schedule, number>()

export function getEventDayKey(event: Schedule): number {
	let key = dayKeyCache.get(event)
	if (key === undefined) {
		const d = new Date(event.startedAt * 1000)
		key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
		dayKeyCache.set(event, key)
	}
	return key
}

// ---------------------------------------------------------------------------
// Formatted time range: "HH:mm - HH:mm"
// ---------------------------------------------------------------------------

const timeRangeCache = new WeakMap<Schedule, string>()

function pad2(n: number): string {
	return n < 10 ? `0${n}` : `${n}`
}

export function getEventTimeRange(event: Schedule): string {
	let range = timeRangeCache.get(event)
	if (range === undefined) {
		const start = new Date(event.startedAt * 1000)
		const end = new Date(event.endedAt * 1000)
		range = `${pad2(start.getHours())}:${pad2(start.getMinutes())} - ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
		timeRangeCache.set(event, range)
	}
	return range
}

// ---------------------------------------------------------------------------
// Formatted date string: "d MMMM yyyy" in Ukrainian
// ---------------------------------------------------------------------------

const dateStringCache = new WeakMap<Schedule, string>()

export function getEventDateString(event: Schedule): string {
	let str = dateStringCache.get(event)
	if (str === undefined) {
		str = format(new Date(event.startedAt * 1000), "d MMMM yyyy", { locale: uk })
		dateStringCache.set(event, str)
	}
	return str
}

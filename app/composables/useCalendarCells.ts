import { endOfMonth, startOfMonth, addDays, startOfWeek, format } from "date-fns"
import { uk } from "date-fns/locale"
import type { ICalendarCell } from "~/types/calendar"
import { WEEK_OPTIONS } from "~/constants/calendar"

// Week day abbreviations never change at runtime — compute once at module load.
// Uses a fixed Monday as anchor (any Monday works; locale determines the names).
const WEEK_DAY_NAMES: string[] = (() => {
	const anchor = new Date(2024, 0, 1) // 2024-01-01 is a Monday
	const weekStart = startOfWeek(anchor, WEEK_OPTIONS)
	return Array.from({ length: 7 }, (_, i) => {
		const day = addDays(weekStart, i)
		const name = format(day, "E", { locale: uk })
		return name.charAt(0).toUpperCase() + name.slice(1)
	})
})()

// Calendar cell arrays are memoized by "YYYY-M" key. The same month always
// produces identical cell grids, so reusing the cached array means Vue's v-for
// skips patching entirely when the user navigates within the same month.
//
// Eviction policy: LRU. JavaScript's Map preserves insertion order, so a hit
// re-inserts the entry to make it the newest, and overflow drops `keys().next()`
// (the genuinely oldest). This matches typical user navigation — a user
// flipping between current month and the next two months keeps those hot.
// Memory cost: ~42 objects × cached months. Capped at 24 entries (~2 years).
const MAX_CELLS_CACHE = 24
const cellsCache = new Map<string, ICalendarCell[]>()

export const useCalendarCells = () => {
	const getCalendarCells = (selectedDate: Date): ICalendarCell[] => {
		const year = selectedDate.getFullYear()
		const month = selectedDate.getMonth()
		const cacheKey = `${year}-${month}`

		const cached = cellsCache.get(cacheKey)
		if (cached) {
			// LRU touch: move this key to the newest position.
			cellsCache.delete(cacheKey)
			cellsCache.set(cacheKey, cached)
			return cached
		}

		const daysInMonth = endOfMonth(selectedDate).getDate()
		const firstDayOfMonth = startOfMonth(selectedDate)

		const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7
		const daysInPrevMonth = endOfMonth(new Date(year, month - 1)).getDate()

		const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
			const day = daysInPrevMonth - firstDayOfWeek + i + 1
			return {
				day,
				currentMonth: false,
				date: new Date(year, month - 1, day),
			}
		})

		const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
			day: i + 1,
			currentMonth: true,
			date: new Date(year, month, i + 1),
		}))

		const totalDays = firstDayOfWeek + daysInMonth
		const nextMonthDays = Array.from({ length: (7 - (totalDays % 7)) % 7 }, (_, i) => ({
			day: i + 1,
			currentMonth: false,
			date: new Date(year, month + 1, i + 1),
		}))

		const cells = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]

		if (cellsCache.size >= MAX_CELLS_CACHE) {
			// Evict least-recently-used entry (first key in insertion order).
			cellsCache.delete(cellsCache.keys().next().value!)
		}
		cellsCache.set(cacheKey, cells)

		return cells
	}

	// Returns the constant Mon–Sun abbreviated names for the current locale.
	// Accepts selectedDate for API compatibility but ignores it — names are locale-invariant.
	const getWeekDays = (_selectedDate?: Date): string[] => WEEK_DAY_NAMES

	const getWeekDaysDetailed = (selectedDate: Date): Date[] => {
		const weekStart = startOfWeek(selectedDate, WEEK_OPTIONS)
		return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
	}

	return {
		getCalendarCells,
		getWeekDays,
		getWeekDaysDetailed,
	}
}

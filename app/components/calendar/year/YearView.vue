<script setup lang="ts">
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { format, isSameYear, isToday, isThisMonth } from "date-fns"
import { uk } from "date-fns/locale"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { eventsByDayKey } = storeToRefs(calendarStore)
const { getCalendarCells } = useCalendarCells()
const { trackEvent } = useAnalytics()

const hasEvents = computed(() => props.events.length > 0)

/**
 * Richer cell shape — pre-baked at buildPanel time so MonthMini.vue doesn't
 * call isToday() or colorByDayKey.get() per render.
 *
 * - isToday: eliminates ~420 date-fns isToday() calls per Year panel (12 months × ~35 cells)
 * - colorClass: eliminates reactive Map.get() per cell (was tracking as a dep)
 */
interface MonthMiniCell {
	date: Date
	currentMonth: boolean
	isToday: boolean
	/** Dominant event-type bg class for this day, or undefined if no events. */
	colorClass: string | undefined
}

interface MonthMiniData {
	label: string
	date: Date
	/** Pre-baked for the wrapper/header — avoids calling isThisMonth(date) twice per render. */
	isThisMonth: boolean
	cells: MonthMiniCell[]
}

interface YearPanel {
	/** January 1st of the year — required by SwipeablePanel. */
	date: Date
	year: number
	months: MonthMiniData[]
}

// Pre-compute dominant event-type color for every day in the visible year.
function getDominantColor(events: Schedule[]): string {
	if (events.length === 0) return ""
	const counts = new Map<string, number>()
	for (const e of events) {
		counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
	}
	let dominant = ""
	let max = 0
	for (const [type, count] of counts) {
		if (count > max) {
			max = count
			dominant = type
		}
	}
	return EVENT_TYPE_COLORS[dominant as keyof typeof EVENT_TYPE_COLORS] ?? ""
}

/**
 * Build a fully frozen MonthMini for the given month.
 * All per-cell derived values (isToday, colorClass) are pre-baked here
 * so MonthMini.vue never calls date-fns or does Map lookups at render time.
 */
function buildMonthMini(
	year: number,
	monthIndex: number,
	colorByDayKey: Map<number, string>
): MonthMiniData {
	const date = new Date(year, monthIndex, 1)
	const thisMonth = isThisMonth(date)
	const cells: MonthMiniCell[] = getCalendarCells(date).map((c) => ({
		date: c.date,
		currentMonth: c.currentMonth,
		isToday: isToday(c.date),
		colorClass: colorByDayKey.get(c.date.getTime()) || undefined,
	}))
	return {
		label: format(date, "LLLL", { locale: uk }),
		date,
		isThisMonth: thisMonth,
		cells,
	}
}

function buildPanel(seedDate: Date): YearPanel {
	const year = seedDate.getFullYear()

	// Compute color map once for the whole year — used per cell in buildMonthMini.
	const colorByDayKey = new Map<number, string>()
	for (const [key, events] of eventsByDayKey.value) {
		const color = getDominantColor(events)
		if (color) colorByDayKey.set(key, color)
	}

	return {
		date: new Date(year, 0, 1),
		year,
		months: Array.from({ length: 12 }, (_, i) => buildMonthMini(year, i, colorByDayKey)),
	}
}

const yearRootEl = useTemplateRef("yearRoot")

const {
	currentPanel,
	incomingPanel,
	currentX,
	incomingX,
	onDragStart,
	onDrag,
	onDragEnd,
} = useSwipeNavigator<YearPanel>({
	view: "year",
	containerRef: yearRootEl,
	buildPanel,
	samePeriod: isSameYear,
	events: () => props.events,
	fallbackWidth: 1200,
})

function onDayClick(date: Date) {
	calendarStore.setNavigationDirection(null)
	calendarStore.setSelectedDate(date)
	calendarStore.setView("day")
	trackEvent("view_changed", { view: "day", source: "year_view" })
}

function onMonthClick(date: Date) {
	calendarStore.setNavigationDirection(null)
	calendarStore.setSelectedDate(date)
	calendarStore.setView("month")
	trackEvent("view_changed", { view: "month", source: "year_view" })
}
</script>

<template>
	<div ref="yearRoot" class="relative flex h-full flex-col overflow-hidden">
		<!-- ----------------------------------------------------------------
			 Mobile layout (< lg): natural-height scrollable 2-column grid.
			 No slide animation — year changes are an instant swap.
			 ---------------------------------------------------------------- -->
		<div
			class="min-h-0 flex-1 overflow-y-auto lg:hidden"
		>
			<div class="grid grid-cols-2 gap-2 p-2">
				<BigCalendarMonthMini
					v-for="month in currentPanel.months"
					:key="month.date.getTime()"
					:month="month"
					@day-click="onDayClick"
					@month-click="onMonthClick"
				/>
			</div>
		</div>

		<!-- ----------------------------------------------------------------
			 Desktop layout (lg+): absolute two-panel slide animation.
			 ---------------------------------------------------------------- -->
		<div
			class="relative hidden min-h-0 flex-1 overflow-hidden lg:block"
		>
		<!-- Incoming panel — non-interactive during slide animation -->
		<motion.div
			v-if="incomingPanel"
			class="absolute inset-0 grid grid-cols-4 gap-2 p-1"
			:style="{ x: incomingX, willChange: 'transform', contain: 'layout paint' }"
		>
			<BigCalendarMonthMini
				v-for="month in incomingPanel.months"
				:key="month.date.getTime()"
				:month="month"
				:interactive="false"
			/>
		</motion.div>

			<!-- Current panel — draggable -->
			<motion.div
				class="absolute inset-0 grid grid-cols-4 gap-2 p-1"
				:style="{ x: currentX, willChange: 'transform', contain: 'layout paint' }"
				drag="x"
				:drag-constraints="{ left: 0, right: 0 }"
				:drag-elastic="0.1"
				:drag-momentum="false"
				@drag-start="onDragStart"
				@drag="onDrag"
				@drag-end="onDragEnd"
			>
				<BigCalendarMonthMini
					v-for="month in currentPanel.months"
					:key="month.date.getTime()"
					:month="month"
					@day-click="onDayClick"
					@month-click="onMonthClick"
				/>
			</motion.div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цьому році немає запланованих пар"
		/>
	</div>
</template>

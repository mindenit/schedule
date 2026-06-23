<script setup lang="ts">
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { format, isSameYear } from "date-fns"
import { uk } from "date-fns/locale"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { eventsByDayKey } = storeToRefs(calendarStore)
const { getCalendarCells } = useCalendarCells()

const hasEvents = computed(() => props.events.length > 0)

interface MonthMini {
	label: string
	date: Date
	cells: { date: Date; currentMonth: boolean }[]
}

interface YearPanel {
	/** January 1st of the year — required by SwipeablePanel. */
	date: Date
	year: number
	months: MonthMini[]
}

function buildMonthMini(year: number, monthIndex: number): MonthMini {
	const date = new Date(year, monthIndex, 1)
	const cells = getCalendarCells(date).map((c) => ({ date: c.date, currentMonth: c.currentMonth }))
	return {
		label: format(date, "LLLL", { locale: uk }),
		date,
		cells,
	}
}

function buildPanel(seedDate: Date): YearPanel {
	const year = seedDate.getFullYear()
	return {
		date: new Date(year, 0, 1),
		year,
		months: Array.from({ length: 12 }, (_, i) => buildMonthMini(year, i)),
	}
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

const colorByDayKey = computed<Map<number, string>>(() => {
	const result = new Map<number, string>()
	for (const [key, events] of eventsByDayKey.value) {
		const color = getDominantColor(events)
		if (color) result.set(key, color)
	}
	return result
})

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
}

function onMonthClick(date: Date) {
	calendarStore.setNavigationDirection(null)
	calendarStore.setSelectedDate(date)
	calendarStore.setView("month")
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
			:class="{ 'blur-sm': !hasEvents }"
		>
			<div class="grid grid-cols-2 gap-2 p-2">
				<BigCalendarMonthMini
					v-for="month in currentPanel.months"
					:key="month.date.getTime()"
					:month="month"
					:color-by-day-key="colorByDayKey"
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
			:class="{ 'blur-sm': !hasEvents }"
		>
			<!-- Incoming panel -->
			<motion.div
				v-if="incomingPanel"
				class="absolute inset-0 grid grid-cols-4 gap-2 p-1"
				:style="{ x: incomingX }"
			>
				<BigCalendarMonthMini
					v-for="month in incomingPanel.months"
					:key="month.date.getTime()"
					:month="month"
					:color-by-day-key="colorByDayKey"
					@day-click="onDayClick"
					@month-click="onMonthClick"
				/>
			</motion.div>

			<!-- Current panel — draggable -->
			<motion.div
				class="absolute inset-0 grid grid-cols-4 gap-2 p-1"
				:style="{ x: currentX }"
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
					:color-by-day-key="colorByDayKey"
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

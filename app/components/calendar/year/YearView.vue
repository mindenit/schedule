<script setup lang="ts">
import type { Schedule } from "nurekit"
import { storeToRefs } from "pinia"
import { motion, animate, useMotionValue, type AnimationPlaybackControls } from "motion-v"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { SWIPE_SPRING_TRANSITION } from "~/constants"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, eventsByDayKey } = storeToRefs(calendarStore)
const { getCalendarCells } = useCalendarCells()
const { trackEvent } = useAnalytics()

const hasEvents = computed(() => props.events.length > 0)

// ---------------------------------------------------------------------------
// Year panel — 12 month grids, each month has its cells
// ---------------------------------------------------------------------------
interface MonthMini {
	label: string
	date: Date
	cells: { date: Date; currentMonth: boolean }[]
}

interface YearPanel {
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

function buildPanel(date: Date): YearPanel {
	const year = date.getFullYear()
	return {
		year,
		months: Array.from({ length: 12 }, (_, i) => buildMonthMini(year, i)),
	}
}

const currentPanel = ref<YearPanel>(buildPanel(selectedDate.value))
const incomingPanel = ref<YearPanel | null>(null)

// ---------------------------------------------------------------------------
// Performance: pre-compute dominant event-type color for every day in the year.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Motion values — desktop slide animation only
// ---------------------------------------------------------------------------
const currentX = useMotionValue(0)
const incomingX = useMotionValue(0)

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const yearRootEl = useTemplateRef("yearRoot")
const isNavigating = ref(false)
let inflightControls: AnimationPlaybackControls[] = []

function getWidth(): number {
	return yearRootEl.value?.clientWidth ?? 300
}

function cancelInflight() {
	inflightControls.forEach((c) => c.stop())
	inflightControls = []
}

async function navigateTo(dir: "left" | "right", newDate: Date) {
	cancelInflight()
	isNavigating.value = true

	const incoming = buildPanel(newDate)
	incomingPanel.value = incoming

	const w = getWidth()
	incomingX.set(dir === "left" ? w : -w)

	calendarStore.setSelectedDate(newDate)

	const exitX = dir === "left" ? -w : w
	const controls = [
		animate(currentX, exitX, SWIPE_SPRING_TRANSITION),
		animate(incomingX, 0, SWIPE_SPRING_TRANSITION),
	]
	inflightControls = controls
	await Promise.all(controls)

	if (inflightControls !== controls) return

	isNavigating.value = false
	currentPanel.value = incoming
	incomingPanel.value = null
	currentX.set(0)
	incomingX.set(0)

	trackEvent("date_navigated", {
		direction: dir === "left" ? "next" : "prev",
		view: "year",
		source: "external",
	})
}

// React to store date changes (DateNavigator buttons, keyboard shortcuts, today)
watch(selectedDate, (newDate) => {
	if (isNavigating.value && incomingPanel.value?.year === newDate.getFullYear()) return
	if (newDate.getFullYear() === currentPanel.value.year) return
	const dir: "left" | "right" = newDate.getFullYear() > currentPanel.value.year ? "left" : "right"
	navigateTo(dir, newDate)
})

// ---------------------------------------------------------------------------
// Click handlers
// ---------------------------------------------------------------------------
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
			 Mobile layout (< lg): natural-height scrollable 3-column grid.
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

			<!-- Current panel -->
			<motion.div
				class="absolute inset-0 grid grid-cols-4 gap-2 p-1"
				:style="{ x: currentX }"
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

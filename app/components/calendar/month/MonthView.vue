<script setup lang="ts">
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { isSameMonth } from "date-fns"
import type { ICalendarCell } from "~/types/calendar"

interface Props {
	events: Schedule[]
}

// Props accepted so Root.vue's contract is unchanged.
// hasEvents uses props.events (filter-aware). Grid cells come from the store date.
const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, eventsByDayKey } = storeToRefs(calendarStore)
const { effectiveTimezone } = useTimezone()

const { getCalendarCells, getWeekDays } = useCalendarCells()

const hasEvents = computed(() => props.events.length > 0)
const weekDays = computed(() => getWeekDays(selectedDate.value))

interface MonthPanel {
	date: Date
	cells: ICalendarCell[]
	weeksCount: number
}

function buildPanel(date: Date): MonthPanel {
	const cells = getCalendarCells(date)
	return { date, cells, weeksCount: Math.ceil(cells.length / 7) }
}

const monthRootEl = useTemplateRef("monthRoot")

const {
	currentPanel,
	incomingPanel,
	currentX,
	incomingX,
	onDragStart,
	onDrag,
	onDragEnd,
} = useSwipeNavigator<MonthPanel>({
	view: "month",
	containerRef: monthRootEl,
	buildPanel,
	samePeriod: isSameMonth,
	events: () => props.events,
	timezone: () => effectiveTimezone.value,
})
</script>

<template>
	<div ref="monthRoot" class="relative flex h-full flex-col">
		<!-- Week day header — outside the animated panels, always visible -->
		<div class="mb-1 grid flex-shrink-0 grid-cols-7 gap-1">
			<div
				v-for="day in weekDays"
				:key="day"
				class="bg-muted/50 text-muted-foreground flex items-center justify-center py-2 text-xs
					font-medium md:first:rounded-tl-2xl md:last:rounded-tr-2xl"
			>
				{{ day }}
			</div>
		</div>

		<div
			class="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl"
			:class="{ 'blur-sm': !hasEvents }"
		>
			<!-- Incoming panel (peek panel during drag, or animating in) -->
			<motion.div
				v-if="incomingPanel"
				class="absolute inset-0 grid grid-cols-7 gap-1 overflow-hidden"
				:style="{
					gridTemplateRows: `repeat(${incomingPanel.weeksCount}, 1fr)`,
					x: incomingX,
				}"
			>
				<BigCalendarDayCell
					v-for="(cell, index) in incomingPanel.cells"
					:key="index"
					:cell="cell"
					:day-events="eventsByDayKey.get(cell.date.getTime()) ?? []"
					class="min-h-0"
				/>
			</motion.div>

			<!-- Current panel — always rendered, draggable -->
			<motion.div
				class="absolute inset-0 grid grid-cols-7 gap-1 overflow-hidden"
				:style="{
					gridTemplateRows: `repeat(${currentPanel.weeksCount}, 1fr)`,
					x: currentX,
				}"
				drag="x"
				:drag-constraints="{ left: 0, right: 0 }"
				:drag-elastic="0.1"
				:drag-momentum="false"
				@drag-start="onDragStart"
				@drag="onDrag"
				@drag-end="onDragEnd"
			>
				<BigCalendarDayCell
					v-for="(cell, index) in currentPanel.cells"
					:key="index"
					:cell="cell"
					:day-events="eventsByDayKey.get(cell.date.getTime()) ?? []"
					class="min-h-0"
				/>
			</motion.div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цьому місяці немає запланованих пар"
		/>
	</div>
</template>

<script setup lang="ts">
import { isSameWeek } from "date-fns"
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { WEEK_OPTIONS } from "~/constants/calendar"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const { getWeekDaysDetailed } = useCalendarCells()
const { effectiveTimezone } = useTimezone()

interface WeekPanel {
	/** Same as weekStart — kept under this name for SwipeablePanel compatibility. */
	date: Date
	weekStart: Date
	weekDays: Date[]
	groupedEventsByDay: Schedule[][][]
}

function buildPanel(seedDate: Date): WeekPanel {
	const weekDays = getWeekDaysDetailed(seedDate)
	const weekStart = weekDays[0]!
	return {
		date: weekStart,
		weekStart,
		weekDays,
		groupedEventsByDay: weekDays.map((day) =>
			groupEvents(getEventsForDate(props.events, day, effectiveTimezone.value))
		),
	}
}

const weekRootEl = useTemplateRef("weekRoot")

const { currentPanel, incomingPanel, currentX, incomingX, onDragStart, onDrag, onDragEnd } =
	useSwipeNavigator<WeekPanel>({
		view: "week",
		containerRef: weekRootEl,
		buildPanel,
		samePeriod: (a, b) => isSameWeek(a, b, WEEK_OPTIONS),
		events: () => props.events,
		timezone: () => effectiveTimezone.value,
		fallbackWidth: 800,
		// Drag is enabled for desktop (lg+) where the 800px grid fits without
		// horizontal scroll. The template renders two separate layouts:
		// mobile uses a plain scrollable grid; desktop uses the motion.div panels.
	})

const hasEvents = computed(() =>
	currentPanel.value.groupedEventsByDay.some((dayGroups) => dayGroups.some((g) => g.length > 0))
)

// Avoid hydration mismatch: new Date() diverges between SSR and client.
// null on server → no "today" highlight; real Date after mount.
const clientToday = ref<Date | null>(null)
onMounted(() => {
	clientToday.value = new Date()
})
</script>

<template>
	<div ref="weekRoot" class="relative flex h-full flex-col">
		<!-- ----------------------------------------------------------------
			 Mobile layout (< lg): single scrollable grid, no slide animation.
			 Horizontal day-scroll + DateNavigator buttons handle navigation.
			 ---------------------------------------------------------------- -->
		<div
			class="relative flex flex-1 overflow-x-auto overflow-y-hidden lg:hidden"
			:class="{ 'blur-sm': !hasEvents }"
		>
			<BigCalendarWeekGrid
				:week-days="currentPanel.weekDays"
				:grouped-events-by-day="currentPanel.groupedEventsByDay"
				:tz="effectiveTimezone"
				:panel-time="currentPanel.date.getTime()"
				:client-today="clientToday"
				:show-timeline="true"
			/>
		</div>

		<!-- ----------------------------------------------------------------
			 Desktop layout (lg+): absolute two-panel slide + drag-to-swipe.
			 At lg+ the 800px grid fits inside the calendar area so horizontal
			 scroll does not compete with the swipe gesture.
			 ---------------------------------------------------------------- -->
		<div class="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col">
			<!-- Incoming panel (non-interactive during animation) -->
			<motion.div
				v-if="incomingPanel"
				class="absolute inset-0 flex flex-col overflow-x-auto"
				:style="{ x: incomingX, willChange: 'transform', contain: 'layout paint' }"
			>
				<BigCalendarWeekGrid
					:week-days="incomingPanel.weekDays"
					:grouped-events-by-day="incomingPanel.groupedEventsByDay"
					:tz="effectiveTimezone"
					:panel-time="incomingPanel.date.getTime()"
					:interactive="false"
					:client-today="clientToday"
				/>
			</motion.div>

			<!-- Current panel — draggable -->
			<motion.div
				class="absolute inset-0 flex flex-col overflow-x-auto"
				:class="{ 'blur-sm': !hasEvents }"
				:style="{ x: currentX, willChange: 'transform', contain: 'layout paint' }"
				drag="x"
				:drag-constraints="{ left: 0, right: 0 }"
				:drag-elastic="0.1"
				:drag-momentum="false"
				@drag-start="onDragStart"
				@drag="onDrag"
				@drag-end="onDragEnd"
			>
				<BigCalendarWeekGrid
					:week-days="currentPanel.weekDays"
					:grouped-events-by-day="currentPanel.groupedEventsByDay"
					:tz="effectiveTimezone"
					:panel-time="currentPanel.date.getTime()"
					:client-today="clientToday"
					:show-timeline="true"
				/>
			</motion.div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цьому тижні немає запланованих пар"
		/>
	</div>
</template>

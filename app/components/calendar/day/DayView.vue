<script setup lang="ts">
import type { Schedule } from "nurekit"
import { isSameDay } from "date-fns"
import { motion } from "motion-v"
import { CalendarAnimationUtils } from "~/constants"
import { CALENDAR_HOURS } from "~/constants/calendar"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const { formatHour } = useEventFormatting()
const { effectiveTimezone } = useTimezone()

// Avoid hydration mismatch: new Date() diverges between SSR and client.
// Start false (server never knows "today"), flip to the real value after mount.
const isToday = ref(false)
onMounted(() => {
	isToday.value = isSameDay(selectedDate.value, new Date())
	watch(selectedDate, (d) => {
		isToday.value = isSameDay(d, new Date())
	})
})

const hours = CALENDAR_HOURS

interface DayPanel {
	date: Date
	groupedEvents: Schedule[][]
	key: string
}

function buildPanel(date: Date): DayPanel {
	const events = getEventsForDate(props.events, date, effectiveTimezone.value)
	return {
		date,
		groupedEvents: groupEvents(events),
		key: CalendarAnimationUtils.createDateKey(date),
	}
}

const dayViewEl = useTemplateRef("dayView")

const {
	currentPanel,
	incomingPanel,
	currentX,
	incomingX,
	onDragStart,
	onDrag,
	onDragEnd,
} = useSwipeNavigator<DayPanel>({
	view: "day",
	containerRef: dayViewEl,
	buildPanel,
	samePeriod: isSameDay,
	events: () => props.events,
	timezone: () => effectiveTimezone.value,
})

const hasEvents = computed(() => currentPanel.value.groupedEvents.length > 0)
</script>

<template>
	<div ref="dayView" class="relative flex h-full rounded-lg">
		<div class="relative flex flex-1 flex-col overflow-hidden">
			<!-- Incoming panel (behind / beside current during animation or drag) -->
			<motion.div
				v-if="incomingPanel"
				class="absolute inset-0 flex flex-col"
				:style="{ x: incomingX }"
			>
				<div class="flex min-h-0 flex-1 gap-1">
					<div class="relative flex w-18 flex-shrink-0 flex-col">
						<div
							v-for="(hour, index) in hours"
							:key="hour"
							class="bg-muted/50 relative flex flex-1 items-start justify-end pr-2"
						>
							<span v-if="index !== 0" class="text-muted-foreground text-xs">
								{{ formatHour(hour) }}
							</span>
						</div>
					</div>
					<div class="relative flex-1">
						<div class="flex h-full flex-col gap-1">
							<div v-for="hour in hours" :key="hour" class="bg-card relative flex-1"></div>
						</div>
						<div class="absolute inset-0">
							<BigCalendarEventRenderer
								:grouped-events="incomingPanel.groupedEvents"
								:day="incomingPanel.date"
								:tz="effectiveTimezone"
							/>
						</div>
					</div>
				</div>
			</motion.div>

			<!-- Current panel — always rendered, draggable -->
			<motion.div
				class="absolute inset-0 flex flex-col"
				:class="{ 'blur-sm': !hasEvents }"
				:style="{ x: currentX }"
				drag="x"
				:drag-constraints="{ left: 0, right: 0 }"
				:drag-elastic="0.1"
				:drag-momentum="false"
				@drag-start="onDragStart"
				@drag="onDrag"
				@drag-end="onDragEnd"
			>
				<div class="flex min-h-0 flex-1 gap-1">
					<div class="relative flex w-18 flex-shrink-0 flex-col">
						<div
							v-for="(hour, index) in hours"
							:key="hour"
							class="bg-muted/50 relative flex flex-1 items-start justify-end pr-2"
						>
							<span v-if="index !== 0" class="text-muted-foreground text-xs">
								{{ formatHour(hour) }}
							</span>
						</div>
					</div>
					<div class="relative flex-1">
						<div class="flex h-full flex-col gap-1">
							<div v-for="hour in hours" :key="hour" class="bg-card relative flex-1"></div>
						</div>
						<div class="absolute inset-0">
							<BigCalendarEventRenderer
								:grouped-events="currentPanel.groupedEvents"
								:day="currentPanel.date"
								:tz="effectiveTimezone"
							/>
						</div>
						<BigCalendarTimeline v-if="isToday" />
					</div>
				</div>
			</motion.div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цей день немає запланованих пар"
		/>
	</div>
</template>

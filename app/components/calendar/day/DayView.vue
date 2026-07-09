<script setup lang="ts">
import type { Schedule } from "nurekit"
import { isSameDay, format } from "date-fns"
import { motion } from "motion-v"
import { CalendarAnimationUtils } from "~/constants"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, eventsByDayKey, allEvents } = storeToRefs(calendarStore)

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

interface DayPanel {
	date: Date
	groupedEvents: Schedule[][]
	key: string
}

function buildPanelImpl(date: Date): DayPanel {
	const key = getDayKey(date, effectiveTimezone.value)
	const events = eventsByDayKey.value.get(key) ?? []
	return {
		date,
		groupedEvents: groupEvents(events),
		key: CalendarAnimationUtils.createDateKey(date),
	}
}

// ---------------------------------------------------------------------------
// Panel memo: key = "YYYY-MM-DD" + allEvents reference + timezone.
// Day panels are cheap (single-day lookup), but rebuilding ALL days after a
// filter change (current + 2 peeks = 3 buildPanel calls, sequentially) still
// adds up. Cache busts on new events ref or tz change.
// Capped at 10 entries (a few days of recent navigation history).
// ---------------------------------------------------------------------------
const MAX_PANEL_CACHE = 10
interface DayPanelCacheEntry {
	eventsRef: Schedule[]
	tz: string
	panel: DayPanel
}
const panelCache = new Map<string, DayPanelCacheEntry>()

function buildPanel(date: Date): DayPanel {
	const key = format(date, "yyyy-MM-dd")
	const eventsRef = allEvents.value
	const tz = effectiveTimezone.value
	const entry = panelCache.get(key)
	if (entry && entry.eventsRef === eventsRef && entry.tz === tz) return entry.panel
	const panel = buildPanelImpl(date)
	if (panelCache.size >= MAX_PANEL_CACHE) panelCache.delete(panelCache.keys().next().value!)
	panelCache.set(key, { eventsRef, tz, panel })
	return panel
}

const dayViewEl = useTemplateRef("dayView")

const { currentPanel, incomingPanel, currentX, incomingX, onDragStart, onDrag, onDragEnd } =
	useSwipeNavigator<DayPanel>({
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
				:style="{ x: incomingX, willChange: 'transform', contain: 'layout paint' }"
			>
				<BigCalendarTimegridPanel
					:grouped-events="incomingPanel.groupedEvents"
					:day="incomingPanel.date"
					:tz="effectiveTimezone"
					:interactive="false"
					:renderer-key="incomingPanel.key"
					disable-chips
					detailed
				/>
			</motion.div>

			<!-- Current panel — always rendered, draggable -->
			<motion.div
				class="absolute inset-0 flex flex-col"
				:style="{ x: currentX, willChange: 'transform', contain: 'layout paint' }"
				drag="x"
				:drag-constraints="{ left: 0, right: 0 }"
				:drag-elastic="0.1"
				:drag-momentum="false"
				@drag-start="onDragStart"
				@drag="onDrag"
				@drag-end="onDragEnd"
			>
				<BigCalendarTimegridPanel
					:grouped-events="currentPanel.groupedEvents"
					:day="currentPanel.date"
					:tz="effectiveTimezone"
					:show-timeline="isToday"
					:renderer-key="currentPanel.key"
					disable-chips
					detailed
				/>
			</motion.div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цей день немає запланованих пар"
		/>
	</div>
</template>

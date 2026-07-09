<script setup lang="ts">
import { isSameWeek, startOfWeek, getISOWeek, getYear } from "date-fns"
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { WEEK_OPTIONS } from "~/constants/calendar"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const { getWeekDaysDetailed } = useCalendarCells()
const { effectiveTimezone } = useTimezone()
const calendarStore = useCalendarStore()
const { eventsByDayKey, allEvents } = storeToRefs(calendarStore)

interface WeekPanel {
	/** Same as weekStart — kept under this name for SwipeablePanel compatibility. */
	date: Date
	weekStart: Date
	weekDays: Date[]
	groupedEventsByDay: Schedule[][][]
}

function buildPanelImpl(seedDate: Date): WeekPanel {
	const weekDays = getWeekDaysDetailed(seedDate)
	const weekStart = weekDays[0]!
	return {
		date: weekStart,
		weekStart,
		weekDays,
		groupedEventsByDay: weekDays.map((day) => {
			const key = getDayKey(day, effectiveTimezone.value)
			return groupEvents(eventsByDayKey.value.get(key) ?? [])
		}),
	}
}

// ---------------------------------------------------------------------------
// Panel memo: key = "YYYY-Www" + allEvents reference + timezone.
// Same week revisited with the same events/tz returns the frozen snapshot.
// Invalidates when allEvents reference changes (new fetch/filter response).
// Capped at 10 entries (enough for typical back-and-forth week navigation).
// ---------------------------------------------------------------------------
const MAX_PANEL_CACHE = 10
interface WeekPanelCacheEntry {
	eventsRef: Schedule[]
	tz: string
	panel: WeekPanel
}
const panelCache = new Map<string, WeekPanelCacheEntry>()

function buildPanel(seedDate: Date): WeekPanel {
	const ws = startOfWeek(seedDate, WEEK_OPTIONS)
	// Key by ISO week year + week number to handle year-boundary weeks correctly.
	const key = `${getYear(ws)}-W${getISOWeek(ws)}`
	const eventsRef = allEvents.value
	const tz = effectiveTimezone.value
	const entry = panelCache.get(key)
	if (entry && entry.eventsRef === eventsRef && entry.tz === tz) return entry.panel
	const panel = buildPanelImpl(seedDate)
	if (panelCache.size >= MAX_PANEL_CACHE) panelCache.delete(panelCache.keys().next().value!)
	panelCache.set(key, { eventsRef, tz, panel })
	return panel
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
			 Shared two-panel layout: mobile + desktop.
			 On mobile the grid is no longer horizontally scrollable —
			 7 columns compress to fit the screen width (Google Calendar style).
			 Swipe left/right navigates between weeks on all screen sizes.
			 ---------------------------------------------------------------- -->
		<div class="relative flex-1 overflow-hidden">
			<!-- Incoming panel (non-interactive during animation) -->
			<motion.div
				v-if="incomingPanel"
				aria-hidden="true"
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

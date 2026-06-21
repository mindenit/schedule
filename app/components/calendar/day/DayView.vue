<script setup lang="ts">
import type { Schedule } from "nurekit"
import { storeToRefs } from "pinia"
import { motion, animate, useMotionValue, type AnimationPlaybackControls } from "motion-v"
import { CalendarAnimationUtils, SWIPE_SPRING_TRANSITION } from "~/constants"
import { CALENDAR_HOURS } from "~/constants/calendar"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)
const { trackEvent } = useAnalytics()

const { getEventsForDate, groupEvents } = useEventGrouping()
const { formatHour } = useEventFormatting()
const { effectiveTimezone } = useTimezone()

const isToday = computed(() => {
	return selectedDate.value.toDateString() === new Date().toDateString()
})

const hours = CALENDAR_HOURS

// ---------------------------------------------------------------------------
// Panel snapshots
// "current" is always visible. "incoming" exists only during animation.
// Each owns frozen events so the exiting panel doesn't go blank.
// ---------------------------------------------------------------------------
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

const currentPanel = ref<DayPanel>(buildPanel(selectedDate.value))
const incomingPanel = ref<DayPanel | null>(null)

const hasEvents = computed(() => currentPanel.value.groupedEvents.length > 0)

// ---------------------------------------------------------------------------
// Motion values — one per panel, driven by imperative animate() calls
// ---------------------------------------------------------------------------
const currentX = useMotionValue(0)
const incomingX = useMotionValue(0)

// ---------------------------------------------------------------------------
// Navigation core
// ---------------------------------------------------------------------------
const dayViewEl = useTemplateRef("dayView")
const isNavigating = ref(false)
let inflightControls: AnimationPlaybackControls[] = []

const COMMIT_OFFSET_RATIO = 0.25
const COMMIT_VELOCITY = 400

function getWidth(): number {
	return dayViewEl.value?.clientWidth ?? 300
}

function cancelInflight() {
	inflightControls.forEach((c) => c.stop())
	inflightControls = []
}

async function navigateTo(dir: "left" | "right", newDate: Date, source: string) {
	// Cancel any in-flight animation — the new destination takes priority.
	cancelInflight()
	isNavigating.value = true

	// 1. Snapshot the incoming panel before changing selectedDate.
	const incoming = buildPanel(newDate)

	// 2. Outgoing panel is whatever currentPanel currently shows.
	//    incomingPanel may already be set from a previous interrupted animation;
	//    we promote it to current so the screen doesn't flash.
	incomingPanel.value = incoming

	// 3. Position incoming off-screen on the correct side (in pixels).
	const w = getWidth()
	incomingX.set(dir === "left" ? w : -w)

	// 4. Update store — this changes selectedDate for the rest of the app.
	calendarStore.setSelectedDate(newDate)

	// 5. Animate both panels simultaneously; keep handles so we can cancel.
	const exitX = dir === "left" ? -w : w
	const controls = [
		animate(currentX, exitX, SWIPE_SPRING_TRANSITION),
		animate(incomingX, 0, SWIPE_SPRING_TRANSITION),
	]
	inflightControls = controls
	await Promise.all(controls)

	// If we were cancelled mid-flight the controls list will have changed —
	// bail out so we don't clobber state from the newer navigateTo call.
	if (inflightControls !== controls) return

	// 6. Swap: incoming becomes current, reset positions.
	isNavigating.value = false
	currentPanel.value = incoming
	incomingPanel.value = null
	currentX.set(0)
	incomingX.set(0)

	trackEvent("date_navigated", {
		direction: dir === "left" ? "next" : "prev",
		view: "day",
		source,
	})
}

// ---------------------------------------------------------------------------
// Drag-to-follow: finger moves current panel; incoming panel mirrors it
// ---------------------------------------------------------------------------
const isDragging = ref(false)

// Pre-build peek panels whenever the current panel settles so drag start is zero-cost.
const peekLeft = ref<DayPanel | null>(null) // next day (left swipe)
const peekRight = ref<DayPanel | null>(null) // prev day (right swipe)

function rebuildPeekPanels() {
	const nextDate = navigateDate(currentPanel.value.date, "day", "next")
	const prevDate = navigateDate(currentPanel.value.date, "day", "previous")
	peekLeft.value = buildPanel(nextDate)
	peekRight.value = buildPanel(prevDate)
}

watch(
	currentPanel,
	() => {
		if (!isNavigating.value) rebuildPeekPanels()
	},
	{ immediate: true }
)

function onDragStart() {
	if (isNavigating.value) return
	isDragging.value = true
	// Peek panels are already pre-built; nothing to do here.
}

function onDrag(_e: PointerEvent, info: { offset: { x: number } }) {
	if (!isDragging.value) return
	const offset = info.offset.x

	// Current panel follows the finger.
	currentX.set(offset)

	// Show the peek panel on the correct side and mirror its position.
	const w = getWidth()
	if (offset < 0) {
		// Dragging left → next day appears from right
		incomingPanel.value = peekLeft.value
		incomingX.set(w + offset)
	} else {
		// Dragging right → prev day appears from left
		incomingPanel.value = peekRight.value
		incomingX.set(-w + offset)
	}
}

async function onDragEnd(_e: PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) {
	if (!isDragging.value) return
	isDragging.value = false

	const width = getWidth()
	const shouldCommit =
		Math.abs(info.offset.x) > width * COMMIT_OFFSET_RATIO ||
		Math.abs(info.velocity.x) > COMMIT_VELOCITY

	if (shouldCommit && incomingPanel.value) {
		// Commit: snap incoming to center, snap current out.
		isNavigating.value = true
		const dir: "left" | "right" = info.offset.x < 0 ? "left" : "right"
		const exitX = dir === "left" ? -width : width

		const committed = incomingPanel.value
		calendarStore.setSelectedDate(committed.date)

		const controls = [
			animate(currentX, exitX, SWIPE_SPRING_TRANSITION),
			animate(incomingX, 0, SWIPE_SPRING_TRANSITION),
		]
		inflightControls = controls
		await Promise.all(controls)
		if (inflightControls !== controls) return

		isNavigating.value = false
		currentPanel.value = committed
		incomingPanel.value = null
		currentX.set(0)
		incomingX.set(0)

		trackEvent("date_navigated", {
			direction: dir === "left" ? "next" : "prev",
			view: "day",
			source: "swipe",
		})
	} else {
		// Cancel: spring everything back.
		incomingPanel.value = null
		animate(currentX, 0, SWIPE_SPRING_TRANSITION)
		incomingX.set(0)
	}
}

// ---------------------------------------------------------------------------
// External date changes (button, keyboard, today button, mini-calendar)
// Infer animation direction from the date delta vs the current panel.
// The isDragging guard prevents conflict with touch gestures.
// isNavigating is intentionally NOT checked here — we cancel and restart instead.
// The only re-entry we block is the setSelectedDate call from inside navigateTo
// itself; that is handled by checking that newDate equals the already-in-flight
// destination (store date was just set to newDate by navigateTo).
// ---------------------------------------------------------------------------
watch(selectedDate, (newDate) => {
	if (isDragging.value) return
	// Skip if this change came from our own navigateTo call (avoid infinite loop).
	if (isNavigating.value && incomingPanel.value?.date.getTime() === newDate.getTime()) return
	// Same calendar day — nothing to animate.
	const cur = currentPanel.value.date
	if (
		newDate.getFullYear() === cur.getFullYear() &&
		newDate.getMonth() === cur.getMonth() &&
		newDate.getDate() === cur.getDate()
	)
		return
	const dir: "left" | "right" = newDate >= currentPanel.value.date ? "left" : "right"
	navigateTo(dir, newDate, "external")
})

// ---------------------------------------------------------------------------
// Rebuild current panel when events prop changes (new schedule loaded)
// ---------------------------------------------------------------------------
watch(
	() => props.events,
	() => {
		if (!isNavigating.value) {
			currentPanel.value = buildPanel(selectedDate.value)
		}
	}
)
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

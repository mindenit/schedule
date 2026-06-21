<script setup lang="ts">
import type { Schedule } from "nurekit"
import { storeToRefs } from "pinia"
import { motion, animate, useMotionValue, type AnimationPlaybackControls } from "motion-v"
import { SWIPE_SPRING_TRANSITION } from "~/constants"
import type { ICalendarCell } from "~/types/calendar"

interface Props {
	events: Schedule[]
}

// Props accepted so Root.vue's contract is unchanged.
// hasEvents uses props.events (filter-aware). Grid cells come from the store date.
const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, eventsByDayKey } = storeToRefs(calendarStore)
const { trackEvent } = useAnalytics()

const { getCalendarCells, getWeekDays } = useCalendarCells()

const hasEvents = computed(() => props.events.length > 0)
const weekDays = computed(() => getWeekDays(selectedDate.value))

// ---------------------------------------------------------------------------
// Panel snapshots — each panel owns its grid cells (frozen at navigation time).
// eventsByDayKey is a store-level Map keyed by timestamp and is stable across
// date navigation, so events do NOT need snapshotting per panel.
// ---------------------------------------------------------------------------
interface MonthPanel {
	date: Date
	cells: ICalendarCell[]
	weeksCount: number
}

function buildPanel(date: Date): MonthPanel {
	const cells = getCalendarCells(date)
	return { date, cells, weeksCount: Math.ceil(cells.length / 7) }
}

const currentPanel = ref<MonthPanel>(buildPanel(selectedDate.value))
const incomingPanel = ref<MonthPanel | null>(null)

// ---------------------------------------------------------------------------
// Motion values — driven by imperative animate() calls
// ---------------------------------------------------------------------------
const currentX = useMotionValue(0)
const incomingX = useMotionValue(0)

// ---------------------------------------------------------------------------
// Navigation core
// ---------------------------------------------------------------------------
const monthRootEl = useTemplateRef("monthRoot")
const isNavigating = ref(false)
let inflightControls: AnimationPlaybackControls[] = []

const COMMIT_OFFSET_RATIO = 0.25
const COMMIT_VELOCITY = 400

function getWidth(): number {
	return monthRootEl.value?.clientWidth ?? 300
}

function cancelInflight() {
	inflightControls.forEach((c) => c.stop())
	inflightControls = []
}

async function navigateTo(dir: "left" | "right", newDate: Date, source: string) {
	// Cancel any in-flight animation — the new destination takes priority.
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
		view: "month",
		source,
	})
}

// ---------------------------------------------------------------------------
// Drag-to-follow
// ---------------------------------------------------------------------------
const isDragging = ref(false)
const peekLeft = ref<MonthPanel | null>(null)
const peekRight = ref<MonthPanel | null>(null)

// Pre-build peek panels whenever the current panel settles so drag start is zero-cost.
function rebuildPeekPanels() {
	const nextDate = navigateDate(currentPanel.value.date, "month", "next")
	const prevDate = navigateDate(currentPanel.value.date, "month", "previous")
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
	currentX.set(offset)

	const w = getWidth()
	if (offset < 0) {
		incomingPanel.value = peekLeft.value
		incomingX.set(w + offset)
	} else {
		incomingPanel.value = peekRight.value
		incomingX.set(-w + offset)
	}
}

async function onDragEnd(
	_e: PointerEvent,
	info: { offset: { x: number }; velocity: { x: number } }
) {
	if (!isDragging.value) return
	isDragging.value = false

	const width = getWidth()
	const shouldCommit =
		Math.abs(info.offset.x) > width * COMMIT_OFFSET_RATIO ||
		Math.abs(info.velocity.x) > COMMIT_VELOCITY

	if (shouldCommit && incomingPanel.value) {
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
			view: "month",
			source: "swipe",
		})
	} else {
		incomingPanel.value = null
		animate(currentX, 0, SWIPE_SPRING_TRANSITION)
		incomingX.set(0)
	}
}

// ---------------------------------------------------------------------------
// External date changes (button, keyboard, today button, mini-calendar)
// Infer animation direction from the date delta vs the current panel.
// isDragging guard prevents conflict with touch gestures.
// isNavigating is NOT checked — we cancel and restart instead, so fast clicks
// always land on the correct destination.
// We only skip if the change came from our own navigateTo → setSelectedDate.
// ---------------------------------------------------------------------------
watch(selectedDate, (newDate) => {
	if (isDragging.value) return
	if (isNavigating.value && incomingPanel.value?.date.getTime() === newDate.getTime()) return
	// Same calendar month — nothing to animate.
	const cur = currentPanel.value.date
	if (newDate.getFullYear() === cur.getFullYear() && newDate.getMonth() === cur.getMonth()) return
	const dir: "left" | "right" = newDate >= currentPanel.value.date ? "left" : "right"
	navigateTo(dir, newDate, "external")
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

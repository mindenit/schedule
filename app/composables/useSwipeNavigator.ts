import { ref, watch, type Ref } from "vue"
import { animate, useMotionValue, type AnimationPlaybackControls } from "motion-v"
import { storeToRefs } from "pinia"
import type { Schedule } from "nurekit"
import type { TCalendarView } from "~/types/calendar"
import { SWIPE_SPRING_TRANSITION } from "~/constants"

/**
 * Panel shape required by all swipe-navigated views.
 * The `date` field is used to compute next/prev peek panels and to compare
 * against `selectedDate` when reacting to external navigation.
 */
export interface SwipeablePanel {
	date: Date
}

export interface UseSwipeNavigatorOptions<TPanel extends SwipeablePanel> {
	/** Calendar view name — drives analytics + the navigateDate() step semantics. */
	view: TCalendarView
	/** Container ref used to measure available width for slide animations. */
	containerRef: Readonly<Ref<HTMLElement | null>>
	/** Pure factory that produces a frozen panel snapshot for the given date. */
	buildPanel: (date: Date) => TPanel
	/**
	 * Predicate: are these two dates inside the same period (same day / week / month / year)?
	 * Returning true short-circuits the watcher — no animation runs.
	 */
	samePeriod: (a: Date, b: Date) => boolean
	/**
	 * If true, drag handlers (onDragStart/onDrag/onDragEnd) and pre-built peek
	 * panels are exposed. Defaults to true. Set to false for views where touch
	 * dragging is undesirable (e.g. year view's desktop slide).
	 */
	dragEnabled?: boolean
	/**
	 * Getter for the events array. When the returned array changes the current
	 * panel is rebuilt (unless an animation is in flight) so filter / schedule
	 * swaps surface. A getter (not a ref) so callers can pass `() => props.events`
	 * directly — Vue's reactivity tracks the prop access inside the getter.
	 */
	events: () => Schedule[]
	/**
	 * Optional timezone getter. When provided, the current panel is also rebuilt
	 * on timezone change so day-bucketing reflects the new tz.
	 */
	timezone?: () => string
	/** Fallback width when the container ref hasn't measured yet. */
	fallbackWidth?: number
}

/**
 * Encapsulates the swipe-to-navigate + animated-panel state machine shared by
 * DayView, WeekView, MonthView, and YearView. Each view used to duplicate
 * ~150 LOC of motion-value plumbing, drag handlers, in-flight cancellation,
 * peek-panel pre-build, and selectedDate watching. Now they only provide:
 *
 *   - a `buildPanel(date)` snapshot factory,
 *   - a `samePeriod(a, b)` short-circuit predicate,
 *   - their view name (for analytics + navigateDate step).
 *
 * The composable returns refs + handlers ready to bind in the template.
 *
 * Invariants preserved from the original implementations:
 *   - In-flight animations are cancelled (not awaited) when a new destination
 *     arrives. We compare the stored controls array against the local one to
 *     detect cancellation after `await Promise.all(controls)`.
 *   - `selectedDate` is updated BEFORE the animation runs (so the rest of the
 *     app sees the new date immediately).
 *   - The watcher skips its own setSelectedDate call by checking the in-flight
 *     incoming panel's date against the newly-seen date.
 *   - `events` prop changes only rebuild the current panel when no animation
 *     is in flight (avoid clobbering the visible exiting panel).
 */
export function useSwipeNavigator<TPanel extends SwipeablePanel>(
	options: UseSwipeNavigatorOptions<TPanel>
) {
	const {
		view,
		containerRef,
		buildPanel,
		samePeriod,
		dragEnabled = true,
		events,
		timezone,
		fallbackWidth = 300,
	} = options

	const calendarStore = useCalendarStore()
	const { selectedDate } = storeToRefs(calendarStore)
	const { trackEvent } = useAnalytics()

	const currentPanel = ref(buildPanel(selectedDate.value)) as Ref<TPanel>
	const incomingPanel = ref<TPanel | null>(null) as Ref<TPanel | null>

	const currentX = useMotionValue(0)
	const incomingX = useMotionValue(0)

	const isNavigating = ref(false)
	const isDragging = ref(false)
	let inflightControls: AnimationPlaybackControls[] = []

	const peekLeft = ref<TPanel | null>(null) as Ref<TPanel | null>
	const peekRight = ref<TPanel | null>(null) as Ref<TPanel | null>

	function getWidth(): number {
		return containerRef.value?.clientWidth ?? fallbackWidth
	}

	function cancelInflight() {
		inflightControls.forEach((c) => c.stop())
		inflightControls = []
	}

	async function navigateTo(dir: "left" | "right", newDate: Date, source: string) {
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

		// Cancelled mid-flight — bail out so we don't clobber state from the newer call.
		if (inflightControls !== controls) return

		isNavigating.value = false
		// Re-snapshot using the current events/tz so any data that arrived while
		// the animation was in-flight is reflected immediately (avoids the "empty day"
		// race where events populated during navigation but the rebuild watcher was
		// skipped because isNavigating was true at the time).
		currentPanel.value = buildPanel(newDate)
		incomingPanel.value = null
		currentX.set(0)
		incomingX.set(0)

		trackEvent("date_navigated", {
			direction: dir === "left" ? "next" : "prev",
			view,
			source,
		})
	}

	function rebuildPeekPanels() {
		if (!dragEnabled) return
		const nextDate = navigateDate(currentPanel.value.date, view, "next")
		const prevDate = navigateDate(currentPanel.value.date, view, "previous")
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
		if (!dragEnabled || isNavigating.value) return
		isDragging.value = true
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
			Math.abs(info.offset.x) > width * SWIPE_COMMIT_OFFSET_RATIO ||
			Math.abs(info.velocity.x) > SWIPE_COMMIT_VELOCITY

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
		// Re-snapshot so events that arrived during the swipe animation are shown.
		currentPanel.value = buildPanel(committed.date)
		incomingPanel.value = null
		currentX.set(0)
		incomingX.set(0)

		trackEvent("date_navigated", {
			direction: dir === "left" ? "next" : "prev",
			view,
			source: "swipe",
		})
		} else {
			incomingPanel.value = null
			animate(currentX, 0, SWIPE_SPRING_TRANSITION)
			incomingX.set(0)
		}
	}

	// React to external date changes (DateNavigator buttons, keyboard, today button, mini-calendar).
	watch(selectedDate, (newDate) => {
		if (isDragging.value) return
		// Skip if the change came from our own setSelectedDate call.
		if (isNavigating.value && incomingPanel.value?.date.getTime() === newDate.getTime()) return
		// Same period — nothing to animate.
		if (samePeriod(newDate, currentPanel.value.date)) return
		const dir: "left" | "right" = newDate >= currentPanel.value.date ? "left" : "right"
		navigateTo(dir, newDate, "external")
	})

	// Rebuild current panel when events change (filters/schedule swap) OR timezone
	// changes (day-bucketing depends on tz). Skip during an in-flight animation
	// so we don't clobber the exiting panel.
	// flush:"post" ensures the rebuild runs after the DOM update batch, so any
	// selectedDate change that arrives in the same tick is already committed.
	watch(
		() => [events(), timezone?.() ?? null] as const,
		() => {
			if (!isNavigating.value) {
				currentPanel.value = buildPanel(selectedDate.value)
			}
		},
		{ flush: "post" }
	)

	return {
		currentPanel,
		incomingPanel,
		currentX,
		incomingX,
		isNavigating,
		isDragging,
		navigateTo,
		onDragStart,
		onDrag,
		onDragEnd,
	}
}

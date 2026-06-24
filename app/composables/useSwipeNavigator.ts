import { ref, watch, onMounted, onBeforeUnmount, type Ref } from "vue"
import { animate, useMotionValue, type AnimationPlaybackControls } from "motion-v"
import { storeToRefs } from "pinia"
import type { Schedule } from "nurekit"
import type { TCalendarView } from "~/types/calendar"
import { SWIPE_TWEEN_TRANSITION } from "~/constants"

/**
 * Returns the effective swipe transition config.
 * When the user has requested reduced motion (OS-level setting), the duration
 * is set to 0 so panels swap instantly — no slide animation is shown.
 * This improves accessibility and also avoids composite-layer cost on
 * low-end devices whose users often enable reduced motion for battery.
 */
function getSwipeTransition() {
	if (import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		return { ...SWIPE_TWEEN_TRANSITION, duration: 0 }
	}
	return SWIPE_TWEEN_TRANSITION
}

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
 * DayView, WeekView, MonthView, and YearView.
 *
 * Key invariants and fixes vs. prior implementation:
 *
 * RACE / CORRECTNESS
 *   - Every navigateTo call gets a unique Symbol token. After `await`, the call
 *     checks its own token against `currentToken`. If they differ, another nav
 *     won already — bail immediately. This replaces the brittle inflightControls
 *     reference comparison and handles any number of in-flight cancellations.
 *   - cancelInflight() now also snaps currentX→0 and incomingX→0 synchronously
 *     before the next animation starts. Previously, currentX was frozen at its
 *     mid-animation position, causing the new animation to slide from the wrong
 *     origin (visible as a glitch or jump on rapid presses).
 *   - Rapid external navigation is coalesced: when the selectedDate watcher fires
 *     while an animation is already running, it records the target date in
 *     `pendingDate` instead of launching another animation. When the in-flight
 *     animation settles it picks up pendingDate and runs one final animation to
 *     the correct destination. This eliminates the "events disappear" symptom from
 *     mashing arrow keys.
 *   - `latestTargetDate` tracks the logical navigation target independently of
 *     `currentPanel.value.date`, which only updates AFTER animation settles.
 *     The selectedDate watcher now compares against `latestTargetDate` so that
 *     rapid key presses cannot get stuck in "same-period" early-return while a
 *     stale panel is still on screen. Without this, sidebar-calendar click could
 *     disagree with the panel's anchor date causing missed navigations.
 *   - Post-settle panel promotion: instead of `buildPanel(newDate)` after animation
 *     ends (which drops any mid-flight event updates), we PROMOTE `incomingPanel`
 *     directly to `currentPanel`. The incoming panel is rebuilt mid-flight if
 *     events/timezone change, so it always holds the freshest snapshot.
 *   - Mid-flight incomingPanel rebuild: when props.events changes during a running
 *     animation, both currentPanel AND incomingPanel are rebuilt with the new data
 *     so the content is fresh before promotion occurs.
 *
 * PERFORMANCE
 *   - Peek panels are built LAZILY: only on first onDragStart.
 *   - incomingPanel ref writes in onDrag are guarded against no-op writes to
 *     avoid unnecessary Vue vdom patches on every pointer-move event.
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

	// Unique token per animation run. After await, compare to detect supersession.
	let currentToken: symbol | null = null
	// Active motion-v animation controls (one per running animation).
	let activeControls: AnimationPlaybackControls[] = []
	// When a new navigation arrives while one is in flight, stash the target here.
	// The settling animation picks it up and runs one final hop.
	let pendingDate: Date | null = null
	// Tracks the logical navigation target independently of currentPanel.value.date,
	// which only updates AFTER animation settles. The selectedDate watcher uses this
	// to avoid false "same-period" short-circuits on stale panel state.
	let latestTargetDate: Date = currentPanel.value.date

	const peekLeft = ref<TPanel | null>(null) as Ref<TPanel | null>
	const peekRight = ref<TPanel | null>(null) as Ref<TPanel | null>
	let peekBuilt = false

	function getWidth(): number {
		return containerRef.value?.clientWidth ?? fallbackWidth
	}

	/**
	 * Stop running animations and immediately snap both motion values to 0.
	 * Must be called synchronously before starting a new animation so the new
	 * one always starts from a known-good origin (0 = panel filling the viewport).
	 */
	function cancelAndReset() {
		activeControls.forEach((c) => c.stop())
		activeControls = []
		currentX.set(0)
		incomingX.set(0)
	}

	async function navigateTo(dir: "left" | "right", newDate: Date, source: string) {
		cancelAndReset()
		isNavigating.value = true
		// Update logical target immediately — watcher must see this before any await.
		latestTargetDate = newDate

		const token = Symbol()
		currentToken = token

		const w = getWidth()
		const incoming = buildPanel(newDate)
		incomingPanel.value = incoming
		incomingX.set(dir === "left" ? w : -w)

		calendarStore.setSelectedDate(newDate)

		const transition = getSwipeTransition()
		const exitX = dir === "left" ? -w : w
		const controls = [
			animate(currentX, exitX, transition),
			animate(incomingX, 0, transition),
		]
		activeControls = controls
		await Promise.all(controls)

		// Another navigation superseded us — bail out entirely.
		if (currentToken !== token) return

		isNavigating.value = false

		// Always promote the settled incoming panel first — this keeps the
		// navigator state consistent (currentPanel, currentX, incomingPanel all
		// in sync) regardless of whether a further nav is queued. Skipping the
		// promotion on pendingDate was the Option-1 regression: it left currentX
		// at exitX and currentPanel stale, causing EventRenderer to desync and
		// render empty blocks when the events watcher fired mid-recursion.
		currentPanel.value = (incomingPanel.value ?? incoming) as TPanel
		incomingPanel.value = null
		currentX.set(0)
		incomingX.set(0)
		activeControls = []

		trackEvent("date_navigated", {
			direction: dir === "left" ? "next" : "prev",
			view,
			source,
		})

		// If a navigation was queued while we were running, execute it now.
		if (pendingDate !== null) {
			const target = pendingDate
			pendingDate = null
			const pendingDir: "left" | "right" = target >= latestTargetDate ? "left" : "right"
			navigateTo(pendingDir, target, source)
		} else {
			// Rebuild peek panels for the next drag (non-blocking).
			if (dragEnabled && peekBuilt) rebuildPeekPanels()
		}
	}

	function rebuildPeekPanels() {
		if (!dragEnabled) return
		const nextDate = navigateDate(currentPanel.value.date, view, "next")
		const prevDate = navigateDate(currentPanel.value.date, view, "previous")
		peekLeft.value = buildPanel(nextDate)
		peekRight.value = buildPanel(prevDate)
		peekBuilt = true
	}

	// Rebuild peek panels when currentPanel changes (after a completed navigation).
	// immediate:false — skip at mount, first drag handles the initial build.
	watch(currentPanel, () => {
		if (!isNavigating.value && dragEnabled) rebuildPeekPanels()
	})

	function onDragStart() {
		if (!dragEnabled || isNavigating.value) return
		if (!peekBuilt) rebuildPeekPanels()
		isDragging.value = true
	}

	function onDrag(_e: PointerEvent, info: { offset: { x: number } }) {
		if (!isDragging.value) return
		const offset = info.offset.x
		currentX.set(offset)

		const w = getWidth()
		if (offset < 0) {
			if (incomingPanel.value !== peekLeft.value) {
				incomingPanel.value = peekLeft.value
			}
			incomingX.set(w + offset)
		} else {
			if (incomingPanel.value !== peekRight.value) {
				incomingPanel.value = peekRight.value
			}
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

			const token = Symbol()
			currentToken = token

			const committed = incomingPanel.value
			latestTargetDate = committed.date
			calendarStore.setSelectedDate(committed.date)

			const transition = getSwipeTransition()
			const controls = [
				animate(currentX, exitX, transition),
				animate(incomingX, 0, transition),
			]
			activeControls = controls
			await Promise.all(controls)

			if (currentToken !== token) return

			isNavigating.value = false

			// Always promote first (see navigateTo tail comment for rationale).
			currentPanel.value = (incomingPanel.value ?? committed) as TPanel
			incomingPanel.value = null
			currentX.set(0)
			incomingX.set(0)
			activeControls = []

			trackEvent("date_navigated", {
				direction: dir === "left" ? "next" : "prev",
				view,
				source: "swipe",
			})

			if (pendingDate !== null) {
				const target = pendingDate
				pendingDate = null
				const pendingDir: "left" | "right" = target >= latestTargetDate ? "left" : "right"
				navigateTo(pendingDir, target, "external")
			} else if (peekBuilt) {
				rebuildPeekPanels()
			}
		} else {
			incomingPanel.value = null
			animate(currentX, 0, getSwipeTransition())
			incomingX.set(0)
		}
	}

	// React to external date changes (DateNavigator buttons, keyboard, today button).
	watch(selectedDate, (newDate) => {
		if (isDragging.value) return
		// Skip if it's a date our own navigateTo already set (same target, not just same panel).
		if (
			isNavigating.value &&
			(latestTargetDate.getTime() === newDate.getTime() ||
				pendingDate?.getTime() === newDate.getTime())
		)
			return
		// Same period relative to latest logical target (not stale panel date).
		if (samePeriod(newDate, latestTargetDate)) return

		if (isNavigating.value) {
			// Coalesce: stash as pending, the in-flight animation will pick it up.
			pendingDate = newDate
			return
		}

		const dir: "left" | "right" = newDate >= latestTargetDate ? "left" : "right"
		navigateTo(dir, newDate, "external")
	})

	// Rebuild panels when events or timezone changes.
	// During navigation: rebuild BOTH current and incoming so the content is
	// fresh for post-settle promotion. Outside navigation: just update currentPanel.
	watch(
		() => [events(), timezone?.() ?? null] as const,
		() => {
			if (isNavigating.value) {
				// Refresh incoming so promotion lands with up-to-date events.
				if (incomingPanel.value) {
					incomingPanel.value = buildPanel(incomingPanel.value.date) as TPanel
				}
			} else {
				currentPanel.value = buildPanel(selectedDate.value)
				// Keep peek snapshots in sync with the latest events.
				// Without this, peeks captured during an early onDragStart hold a
				// stale (possibly empty) props.events array, so the next drag shows an
				// empty time-grid until the finger is released.
				if (dragEnabled && peekBuilt) rebuildPeekPanels()
			}
		},
		{ flush: "post" }
	)

	// Midnight staleness fix:
	// Pre-baked cell snapshots include `isToday` and `isThisMonth` flags computed
	// at buildPanel time. Without this timer, those flags would be stale after
	// midnight (yesterday's cell would still appear as "today"). The timer rebuilds
	// the current panel at 00:00:01 each day so all date-relative decorations reset.
	let midnightTimer: ReturnType<typeof setTimeout> | null = null

	function scheduleMidnightRebuild() {
		const now = new Date()
		// Next 00:00:01 — one second past midnight to be safely in the new day.
		const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
		const delay = nextMidnight.getTime() - now.getTime()
		midnightTimer = setTimeout(() => {
			if (!isNavigating.value) {
				currentPanel.value = buildPanel(currentPanel.value.date)
			}
			// Schedule the next rebuild (handles multi-day sessions).
			scheduleMidnightRebuild()
		}, delay)
	}

	onMounted(() => {
		scheduleMidnightRebuild()
	})

	onBeforeUnmount(() => {
		if (midnightTimer !== null) clearTimeout(midnightTimer)
	})

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

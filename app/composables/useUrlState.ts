import { useQueryClient } from "@tanstack/vue-query"
import { format, isValid, parseISO } from "date-fns"
import type { Group, Teacher, Auditorium } from "nurekit"
import type { ScheduleTabType } from "~/types/schedule"

// Derived from shared constants — single source of truth.
const VALID_VIEWS = VIEW_OPTIONS.map((o) => o.value)
const VALID_TYPES = Object.keys(SCHEDULE_TYPES) as ScheduleTabType[]

// Shape of the state object stored in history entries when URL sync is off.
interface HistoryState {
	view: string
	date: string
	scheduleId?: number
	scheduleType?: string
}

// Resolve the display name for an entity by checking the TanStack Query cache
// first (zero cost if AddDialog was already opened), then falling back to a
// direct API call. This keeps the shared-link experience instantaneous when
// the cache is warm and still correct when it is cold.
async function resolveEntityName(
	type: ScheduleTabType,
	id: number,
	queryClient: ReturnType<typeof useQueryClient>,
	nurekit: ReturnType<typeof useNuxtApp>["$nurekit"]
): Promise<string> {
	// Cache keys mirror those in app/queries/*.ts
	const cacheKeyMap: Record<ScheduleTabType, unknown[]> = {
		group: ["groups"],
		teacher: ["teachers"],
		auditorium: ["auditoriums"],
	}

	const cached = queryClient.getQueryData<(Group | Teacher | Auditorium)[]>(cacheKeyMap[type])

	if (cached) {
		const found = cached.find((item) => item.id === id)
		if (found) {
			if (type === "group") return (found as Group).name
			if (type === "teacher") return (found as Teacher).shortName
			if (type === "auditorium") return (found as Auditorium).name
		}
	}

	// Cache miss — fetch the full list so TanStack Query can cache it for
	// AddDialog as a side-effect (uses the same key).
	try {
		if (type === "group") {
			const list = await nurekit.groups.findMany()
			queryClient.setQueryData(["groups"], list)
			return list.find((g) => g.id === id)?.name ?? ""
		}
		if (type === "teacher") {
			const list = await nurekit.teachers.findMany()
			queryClient.setQueryData(["teachers"], list)
			return list.find((t) => t.id === id)?.shortName ?? ""
		}
		if (type === "auditorium") {
			const list = await nurekit.auditoriums.findMany()
			queryClient.setQueryData(["auditoriums"], list)
			return list.find((a) => a.id === id)?.name ?? ""
		}
	} catch {
		// Network failure — return empty; the schedule selector will show an
		// empty name, which is preferable to crashing the page.
	}

	return ""
}

export function useUrlState() {
	if (!import.meta.client) return

	const route = useRoute()
	const router = useRouter()
	const calendarStore = useCalendarStore()
	const scheduleStore = useScheduleStore()
	const settingsStore = useSettingsStore()
	const { $nurekit } = useNuxtApp()
	const queryClient = useQueryClient()

	// When the user disables URL sync, wipe the query params from the current URL.
	watch(
		() => settingsStore.isUrlSyncEnabled,
		(enabled) => {
			if (!enabled) {
				const hasParams =
					route.query.view || route.query.date || route.query.schedule || route.query.type
				if (hasParams) {
					router.replace({ query: {} })
				}
			}
		}
	)

	// ── Read URL → stores ──

	// Track the last view that was committed to the URL (sync-on) or pushed to
	// history state (sync-off) so we can detect view changes and push a new
	// history entry (enabling browser Back/Forward).
	// Initialized from the URL so that the very first syncToUrl (immediate watcher)
	// doesn't treat the initial state as a view change.
	let lastCommittedView: string | null =
		typeof route.query.view === "string" ? route.query.view : null

	// Apply the current route.query values to the stores. Called both on initial
	// mount and whenever the URL changes due to browser Back/Forward navigation.
	const applyUrlToStores = async (query: typeof route.query) => {
		if (!settingsStore.isUrlSyncEnabled) return
		const { view, date, schedule, type } = query

		// view
		if (typeof view === "string" && VALID_VIEWS.includes(view)) {
			// Keep lastCommittedView in sync so that the subsequent syncToUrl
			// (triggered by the store change below) does not treat this URL-driven
			// change as a user-initiated view switch and issue a second router.push.
			lastCommittedView = view
			calendarStore.setView(view as TCalendarView)
		}

		// date (ISO yyyy-MM-dd)
		if (typeof date === "string") {
			const parsed = parseISO(date)
			if (isValid(parsed)) {
				calendarStore.setSelectedDate(parsed)
			}
		}

		// schedule + type — resolve name, then select without touching localStorage
		if (typeof schedule === "string" && typeof type === "string") {
			const id = parseInt(schedule, 10)
			if (!isNaN(id) && VALID_TYPES.includes(type as ScheduleTabType)) {
				const scheduleType = type as ScheduleTabType

				// Wait for the schedule store to finish its localStorage hydration
				// before we override the selection.
				if (!scheduleStore.isInitialized) {
					await nextTick()
				}

				const name = await resolveEntityName(scheduleType, id, queryClient, $nurekit)

				scheduleStore.selectScheduleFromUrl({ id, name, type: scheduleType })
			}
		}
	}

	// Run once on mount (initial page load / direct URL entry).
	onMounted(() => applyUrlToStores(route.query))

	// Re-run whenever the URL query changes — this handles browser Back/Forward
	// when URL sync is enabled.
	watch(() => route.query, applyUrlToStores, { deep: true })

	// ── Sync stores → URL (sync enabled) ──

	// Collect what the URL should look like right now.
	const buildQuery = () => ({
		view: calendarStore.view,
		date: format(calendarStore.selectedDate, DATE_FORMAT_ISO),
		...(scheduleStore.selectedSchedule && {
			schedule: String(scheduleStore.selectedSchedule.id),
			type: scheduleStore.selectedSchedule.type,
		}),
	})

	// Guard: only navigate when something actually changed to avoid infinite
	// feedback loops. Use router.push() when the view changes so the browser
	// Back button returns to the previous view; use router.replace() for
	// date/schedule changes within the same view.
	const syncToUrl = () => {
		if (!settingsStore.isUrlSyncEnabled) return

		const next = buildQuery()
		const q = route.query

		const changed =
			q.view !== next.view ||
			q.date !== next.date ||
			q.schedule !== (next.schedule ?? undefined) ||
			q.type !== (next.type ?? undefined)

		if (!changed) return

		const viewChanged = lastCommittedView !== null && lastCommittedView !== next.view
		lastCommittedView = next.view

		if (viewChanged) {
			router.push({ query: next })
		} else {
			router.replace({ query: next })
		}
	}

	// ── History state management (sync disabled) ──

	// Build a plain state object from current store values. Stored inside
	// history entries via history.pushState() / history.replaceState() so that
	// popstate can restore the UI without touching the URL.
	const buildHistoryState = (): HistoryState => ({
		view: calendarStore.view,
		date: format(calendarStore.selectedDate, DATE_FORMAT_ISO),
		...(scheduleStore.selectedSchedule && {
			scheduleId: scheduleStore.selectedSchedule.id,
			scheduleType: scheduleStore.selectedSchedule.type,
		}),
	})

	// Restore stores from a history state object (called from the popstate handler).
	const applyHistoryState = async (state: HistoryState) => {
		if (VALID_VIEWS.includes(state.view)) {
			lastCommittedView = state.view
			calendarStore.setView(state.view as TCalendarView)
		}

		const parsed = parseISO(state.date)
		if (isValid(parsed)) {
			calendarStore.setSelectedDate(parsed)
		}

		if (
			typeof state.scheduleId === "number" &&
			typeof state.scheduleType === "string" &&
			VALID_TYPES.includes(state.scheduleType as ScheduleTabType)
		) {
			const scheduleType = state.scheduleType as ScheduleTabType
			if (!scheduleStore.isInitialized) await nextTick()
			const name = await resolveEntityName(scheduleType, state.scheduleId, queryClient, $nurekit)
			scheduleStore.selectScheduleFromUrl({ id: state.scheduleId, name, type: scheduleType })
		}
	}

	// Seed the very first history entry with the current state so that Back from
	// the initial page load doesn't leave the user stranded without state.
	const seedInitialHistoryState = () => {
		if (settingsStore.isUrlSyncEnabled) return
		// Only seed if the current history entry has no app state yet.
		if (history.state?.__mindenit) return
		history.replaceState({ ...history.state, __mindenit: buildHistoryState() }, "")
	}

	// Push or replace a history entry (no URL change) when sync is off.
	const syncToHistoryState = () => {
		if (settingsStore.isUrlSyncEnabled) return

		const next = buildHistoryState()
		const prev = history.state?.__mindenit as HistoryState | undefined

		// Nothing changed — skip to avoid polluting the history stack.
		if (
			prev &&
			prev.view === next.view &&
			prev.date === next.date &&
			prev.scheduleId === next.scheduleId &&
			prev.scheduleType === next.scheduleType
		)
			return

		const viewChanged = lastCommittedView !== null && lastCommittedView !== next.view
		lastCommittedView = next.view

		if (viewChanged) {
			history.pushState({ ...history.state, __mindenit: next }, "")
		} else {
			history.replaceState({ ...history.state, __mindenit: next }, "")
		}
	}

	// popstate fires when the user navigates Back/Forward. If the entry carries
	// app state and URL sync is off, restore the stores from it.
	const onPopState = (e: PopStateEvent) => {
		if (settingsStore.isUrlSyncEnabled) return
		const state = e.state?.__mindenit as HistoryState | undefined
		if (state) applyHistoryState(state)
	}

	onMounted(() => {
		seedInitialHistoryState()
		window.addEventListener("popstate", onPopState)
	})

	onUnmounted(() => {
		window.removeEventListener("popstate", onPopState)
	})

	watch(
		[
			() => calendarStore.view,
			() => calendarStore.selectedDate,
			() => scheduleStore.selectedSchedule,
			() => settingsStore.isUrlSyncEnabled,
		],
		() => {
			syncToUrl()
			syncToHistoryState()
		},
		{ immediate: true }
	)
}

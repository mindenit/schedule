import { useQueryClient } from "@tanstack/vue-query"
import { format, isValid, parseISO } from "date-fns"
import type { Group, Teacher, Auditorium } from "nurekit"
import type { ScheduleTabType } from "~/types/schedule"

// Derived from shared constants — single source of truth.
const VALID_VIEWS = VIEW_OPTIONS.map((o) => o.value)
const VALID_TYPES = Object.keys(SCHEDULE_TYPES) as ScheduleTabType[]

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
			queryClient.setQueryData(["auditories"], list)
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

	// ── Read URL → stores (runs once on mount, after localStorage is hydrated) ──

	onMounted(async () => {
		if (!settingsStore.isUrlSyncEnabled) return
		const { view, date, schedule, type } = route.query

		// view
		if (typeof view === "string" && VALID_VIEWS.includes(view)) {
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
	})

	// ── Sync stores → URL (replace, no history entry) ──

	// Collect what the URL should look like right now.
	const buildQuery = () => ({
		view: calendarStore.view,
		date: format(calendarStore.selectedDate, DATE_FORMAT_ISO),
		...(scheduleStore.selectedSchedule && {
			schedule: String(scheduleStore.selectedSchedule.id),
			type: scheduleStore.selectedSchedule.type,
		}),
	})

	// Guard: only call router.replace when something actually changed to avoid
	// infinite feedback loops.
	const syncToUrl = () => {
		if (!settingsStore.isUrlSyncEnabled) return

		const next = buildQuery()
		const q = route.query

		const changed =
			q.view !== next.view ||
			q.date !== next.date ||
			q.schedule !== (next.schedule ?? undefined) ||
			q.type !== (next.type ?? undefined)

		if (changed) {
			router.replace({ query: next })
		}
	}

	watch(
		[
			() => calendarStore.view,
			() => calendarStore.selectedDate,
			() => scheduleStore.selectedSchedule,
			() => settingsStore.isUrlSyncEnabled,
		],
		syncToUrl,
		{ immediate: true }
	)
}

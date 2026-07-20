import { queryOptions } from "@tanstack/vue-query"
import type { MaybeRefOrGetter } from "vue"
import {
	STALE_TIME_ENTITY_LIST,
	STALE_TIME_METADATA,
	STALE_TIME_SCHEDULE,
} from "~/constants/calendar"

/**
 * Generic factories for the three schedule entities (groups / teachers / auditoriums).
 *
 * Each family has the same shape:
 *   - one "list" query (no args)
 *   - one "schedule" query (id, startedAt, endedAt, filters)
 *   - N "metadata" queries (id) — e.g. groupTeachers, teacherSubjects
 *
 * Per-entity files compose these factories instead of repeating the boilerplate
 * (resolveFilters, toValue, enabled, queryFn shape).
 *
 * Fetchers are passed as plain functions. Consumers call useNuxtApp() at the
 * call site (matching the original closure-capture semantics).
 */

type FilterValue = MaybeRefOrGetter<number[]> | MaybeRefOrGetter<string[]>

/** Strips empty filter arrays, unwraps refs/getters. */
const resolveFilters = (filters: Record<string, FilterValue | undefined>) => {
	const out: Record<string, number[] | string[]> = {}
	for (const [key, raw] of Object.entries(filters)) {
		const value = toValue(raw)
		if (Array.isArray(value) && value.length > 0) out[key] = value
	}
	return out
}

/** List-all options (e.g. groups, teachers). */
export const listOptions = <T>(queryKey: string, fetcher: () => Promise<T[]> | T[]) =>
	queryOptions({
		queryKey: [queryKey],
		queryFn: () => fetcher(),
		staleTime: STALE_TIME_ENTITY_LIST,
	})

type ScheduleFetcherArgs = {
	id: number
	startedAt: number
	endedAt: number
	filters: Record<string, number[] | string[]>
}

/** Schedule options — id + window + optional filters. */
export const scheduleOptions = <T>(
	queryKey: string,
	id: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: Record<string, FilterValue | undefined>,
	fetcher: (args: ScheduleFetcherArgs) => Promise<T[]> | T[]
) =>
	queryOptions({
		queryKey: [
			queryKey,
			toValue(id),
			toValue(startedAt),
			toValue(endedAt),
			resolveFilters(filters),
		],
		queryFn: async () => {
			const resolvedId = toValue(id)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			if (!resolvedId || !resolvedStartedAt || !resolvedEndedAt) return []

			const resolvedFilters = resolveFilters(filters)

			return fetcher({
				id: Number(resolvedId),
				startedAt: Number(resolvedStartedAt),
				endedAt: Number(resolvedEndedAt),
				filters: resolvedFilters,
			})
		},
		staleTime: STALE_TIME_SCHEDULE,
		enabled: () => !!(toValue(id) && toValue(startedAt) && toValue(endedAt)),
	})

/** Per-id metadata options (e.g. groupTeachers, auditoriumSubjects). */
export const metadataOptions = <T>(
	queryKey: string,
	id: MaybeRefOrGetter<number | string>,
	fetcher: (id: number) => Promise<T[]> | T[]
) =>
	queryOptions({
		queryKey: [queryKey, toValue(id)],
		queryFn: async () => {
			const resolvedId = toValue(id)
			if (!resolvedId) return []
			return fetcher(Number(resolvedId))
		},
		staleTime: STALE_TIME_METADATA,
		enabled: () => !!toValue(id),
	})

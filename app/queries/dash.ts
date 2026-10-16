import { queryOptions } from "@tanstack/vue-query"
import type { MaybeRef } from "vue"

// ── Types ────────────────────────────────────────────────────────────────────

export interface StepResult {
	ok: boolean
	count: number
	error?: string
}

export interface ManualRefetchStep {
	entityType: "group" | "teacher"
	entityId: number
	ok: boolean
	eventsCount: number
	error?: string
}

export interface SyncSteps {
	auditoriums: StepResult
	groups: StepResult
	teachers: StepResult
	/** Present only when the (currently disabled by default) phantom-skip feature skipped groups that run. */
	phantomSkip?: { count: number }
	/** Present only on trigger="manual" runs. */
	manualRefetch?: ManualRefetchStep
}

export interface SyncRun {
	id: number
	startedAt: string
	finishedAt: string | null
	status: "running" | "success" | "partial" | "failed"
	trigger: "cron" | "bootstrap" | "manual"
	totalGroups: number
	failedGroups: number
	removedEvents: number
	totalEvents: number
	steps: SyncSteps
}

export interface SyncRunGroup {
	runId: number
	groupId: number
	groupName: string | null
	status: "success" | "failed"
	eventsCount: number
	prevEventsCount: number | null
	error: string | null
	finishedAt: string
}

export interface FailedGroupEntry {
	runId: number
	groupId: number
	groupName: string | null
	error: string | null
	finishedAt: string
}

export interface TableSizeEntry {
	tableName: string
	rowCount: number
	sizePretty: string
	sizeBytes: number
}

export interface DashSummary {
	currentStatus: "running" | "success" | "partial" | "failed" | "unknown"
	isRunning: boolean
	lastRun: SyncRun | null
	lastSuccessfulRun: SyncRun | null
	nextCronAt: string | null
	totalRuns: number
	progress: { current: number; total: number } | null
	// shortcut: optional for pre-failingGroups/totalEvents backends, make required once schedule-api with these fields is deployed everywhere
	/** Real count of unresolved failed groups (not capped by the failures list limit). */
	failingGroups?: number
	/** Live row count of the events table. */
	totalEvents?: number
}

export interface CistKeyHealth {
	/** 1-based key position; the key itself is never exposed. */
	index: number
	status: "valid" | "rejected" | "unknown"
	reason?: string
}

export interface CistServerHealth {
	host: string
	up: boolean
	latencyMs: number | null
	keys: CistKeyHealth[]
}

export interface CistHealth {
	checkedAt: string
	servers: CistServerHealth[]
	/** Every key is rejected on every reachable server: keys revoked or CIST-side auth problem. */
	ambiguous: boolean
}

interface ApiResponse<T> {
	success: boolean
	data: T
	error: null | { code: string; message: string }
}

// ── Factories ─────────────────────────────────────────────────────────────────

const BASE_OPTIONS = {
	gcTime: 0,
	staleTime: 0,
	// Ops data — plugins/vue-query.ts skips queries with persist: false when dehydrating to IndexedDB
	meta: { persist: false },
} as const

export function dashSummaryOptions(isRunning: MaybeRef<boolean>) {
	return queryOptions({
		...BASE_OPTIONS,
		queryKey: ["dash", "summary"] as const,
		queryFn: () => $fetch<ApiResponse<DashSummary>>("/dash-api/summary").then((r) => r.data),
		refetchInterval: () => (toValue(isRunning) ? 5_000 : 60_000),
	})
}

export function dashRunsOptions(limit = 30) {
	return queryOptions({
		...BASE_OPTIONS,
		queryKey: ["dash", "runs", limit] as const,
		queryFn: () =>
			$fetch<ApiResponse<SyncRun[]>>(`/dash-api/runs?limit=${limit}`).then(
				(r) => r.data ?? []
			),
		refetchInterval: 60_000,
	})
}

export function dashRunGroupsOptions(runId: MaybeRef<number | null>) {
	return queryOptions({
		...BASE_OPTIONS,
		queryKey: computed(() => ["dash", "run-groups", toValue(runId)]),
		queryFn: () =>
			$fetch<ApiResponse<SyncRunGroup[]>>(`/dash-api/runs/${toValue(runId)}/groups`).then(
				(r) => r.data ?? []
			),
		enabled: computed(() => toValue(runId) !== null),
	})
}

export function dashFailuresOptions(limit = 50) {
	return queryOptions({
		...BASE_OPTIONS,
		queryKey: ["dash", "failures", limit] as const,
		queryFn: () =>
			$fetch<ApiResponse<FailedGroupEntry[]>>(`/dash-api/failures?limit=${limit}`).then(
				(r) => r.data ?? []
			),
		refetchInterval: 60_000,
	})
}

export function dashTableSizesOptions() {
	return queryOptions({
		...BASE_OPTIONS,
		queryKey: ["dash", "table-sizes"] as const,
		queryFn: () =>
			$fetch<ApiResponse<TableSizeEntry[]>>("/dash-api/table-sizes").then(
				(r) => r.data ?? []
			),
		refetchInterval: 5 * 60_000,
	})
}

/**
 * CIST server/key probe. Hits the upstream, so it is fetched once on page load and on
 * "Оновити" only: separate root key (not invalidated by dismiss/refetch actions under ["dash"]),
 * no polling, no focus/reconnect refetch, no retries.
 */
export const DASH_CIST_HEALTH_KEY = ["dash-cist-health"] as const

export function dashCistHealthOptions() {
	return queryOptions({
		...BASE_OPTIONS,
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: false,
		queryKey: DASH_CIST_HEALTH_KEY,
		queryFn: () => $fetch<ApiResponse<CistHealth>>("/dash-api/cist-health").then((r) => r.data),
	})
}

// ── Actions ──────────────────────────────────────────────────────────────────

export interface RefetchResult {
	ok: boolean
	eventsCount: number
	error?: string
}

/** Hides a specific failed group entry from GET /dash/failures. Not reversible manually. */
export function dismissFailure(runId: number, groupId: number) {
	return $fetch<ApiResponse<{ dismissed: boolean }>>(
		`/dash-api/failures/${runId}/${groupId}/dismiss`,
		{ method: "PATCH" }
	).then((r) => r.data)
}

/** Triggers an immediate on-demand refetch of one group's schedule, outside the cron cycle. */
export function refetchGroup(groupId: number) {
	return $fetch<ApiResponse<RefetchResult>>(`/dash-api/refetch/groups/${groupId}`, {
		method: "POST",
	}).then((r) => r.data)
}

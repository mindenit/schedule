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
}

interface ApiResponse<T> {
	success: boolean
	data: T
	error: null | { code: string; message: string }
}

// ── Factories ─────────────────────────────────────────────────────────────────

const BASE_OPTIONS = {
	// Ops data — never persist to IndexedDB
	gcTime: 0,
	staleTime: 0,
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

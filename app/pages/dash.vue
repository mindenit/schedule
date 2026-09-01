<script setup lang="ts">
definePageMeta({
	layout: "dash",
})

useHead({ title: "Dashboard" })
useServerSeoMeta({ robots: "noindex, nofollow" })

// ── Types ────────────────────────────────────────────────────────────────────

interface StepResult {
	ok: boolean
	count: number
	error?: string
}

interface SyncSteps {
	auditoriums: StepResult
	groups: StepResult
	teachers: StepResult
}

interface SyncRun {
	id: number
	startedAt: string
	finishedAt: string | null
	status: "running" | "success" | "partial" | "failed"
	trigger: "cron" | "bootstrap"
	totalGroups: number
	failedGroups: number
	removedEvents: number
	totalEvents: number
	steps: SyncSteps
}

interface SyncRunGroup {
	runId: number
	groupId: number
	status: "success" | "failed"
	eventsCount: number
	prevEventsCount: number | null
	error: string | null
	finishedAt: string
}

interface FailedGroupEntry {
	runId: number
	groupId: number
	error: string | null
	finishedAt: string
}

interface TableSizeEntry {
	tableName: string
	rowCount: number
	sizePretty: string
	sizeBytes: number
}

interface Summary {
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

// ── Fetching ─────────────────────────────────────────────────────────────────

const POLL_RUNNING = 5_000
const POLL_IDLE = 60_000
// Spike: flag removedEvents when it exceeds this fraction of total events
const REMOVED_SPIKE_RATIO = 0.05

const summary = ref<Summary | null>(null)
const runs = ref<SyncRun[]>([])
const failures = ref<FailedGroupEntry[]>([])
const tableSizes = ref<TableSizeEntry[]>([])
const selectedRunId = ref<number | null>(null)
const selectedRunGroups = ref<SyncRunGroup[]>([])
const loadingGroups = ref(false)
const error = ref<string | null>(null)

async function fetchSummary() {
	try {
		const res = await $fetch<ApiResponse<Summary>>("/dash-api/summary")
		summary.value = res.data
	} catch (e) {
		error.value = e instanceof Error ? e.message : String(e)
	}
}

async function fetchRuns() {
	try {
		const res = await $fetch<ApiResponse<SyncRun[]>>("/dash-api/runs?limit=30")
		runs.value = res.data ?? []
	} catch (e) {
		error.value = e instanceof Error ? e.message : String(e)
	}
}

async function fetchGroups(runId: number) {
	loadingGroups.value = true
	try {
		const res = await $fetch<ApiResponse<SyncRunGroup[]>>(`/dash-api/runs/${runId}/groups`)
		selectedRunGroups.value = res.data ?? []
		selectedRunId.value = runId
	} catch (e) {
		error.value = e instanceof Error ? e.message : String(e)
	} finally {
		loadingGroups.value = false
	}
}

async function fetchFailures() {
	try {
		const res = await $fetch<ApiResponse<FailedGroupEntry[]>>("/dash-api/failures?limit=50")
		failures.value = res.data ?? []
	} catch (e) {
		error.value = e instanceof Error ? e.message : String(e)
	}
}

async function fetchTableSizes() {
	try {
		const res = await $fetch<ApiResponse<TableSizeEntry[]>>("/dash-api/table-sizes")
		tableSizes.value = res.data ?? []
	} catch (e) {
		error.value = e instanceof Error ? e.message : String(e)
	}
}

async function refresh() {
	await Promise.all([fetchSummary(), fetchRuns(), fetchFailures(), fetchTableSizes()])
	if (selectedRunId.value !== null) {
		await fetchGroups(selectedRunId.value)
	}
}

// ── Polling ───────────────────────────────────────────────────────────────────

let pollTimer: ReturnType<typeof setTimeout> | null = null

function schedulePoll() {
	if (pollTimer) clearTimeout(pollTimer)
	const interval = summary.value?.isRunning ? POLL_RUNNING : POLL_IDLE
	pollTimer = setTimeout(async () => {
		await refresh()
		schedulePoll()
	}, interval)
}

onMounted(async () => {
	await refresh()
	schedulePoll()
})

onUnmounted(() => {
	if (pollTimer) clearTimeout(pollTimer)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(
	status: SyncRun["status"] | Summary["currentStatus"]
): "success" | "warning" | "destructive" | "secondary" | "info" {
	switch (status) {
		case "success":
			return "success"
		case "partial":
			return "warning"
		case "failed":
			return "destructive"
		case "running":
			return "info"
		default:
			return "secondary"
	}
}

function fmt(iso: string | null | undefined): string {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("uk-UA", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	})
}

function duration(start: string, end: string | null): string {
	if (!end) return "—"
	const ms = new Date(end).getTime() - new Date(start).getTime()
	const s = Math.floor(ms / 1000)
	const m = Math.floor(s / 60)
	const h = Math.floor(m / 60)
	if (h > 0) return `${h}г ${m % 60}хв`
	if (m > 0) return `${m}хв ${s % 60}с`
	return `${s}с`
}

function deltaLabel(curr: number, prev: number | null): string {
	if (prev === null) return ""
	const diff = curr - prev
	if (diff === 0) return ""
	return diff > 0 ? `+${diff}` : String(diff)
}

function deltaClass(curr: number, prev: number | null): string {
	if (prev === null) return ""
	const diff = curr - prev
	if (diff === 0) return ""
	return diff > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
}

function isRemovedSpike(run: SyncRun): boolean {
	if (run.totalEvents === 0) return false
	return run.removedEvents / run.totalEvents > REMOVED_SPIKE_RATIO
}

const STEP_LABELS: Record<string, string> = {
	a: "Аудиторії",
	g: "Групи",
	t: "Викладачі",
}

function stepTitle(name: string, step: StepResult): string {
	const label = STEP_LABELS[name[0].toLowerCase()] ?? name
	const status = step.ok ? "OK" : `Помилка: ${step.error ?? "невідома"}`
	return `${label}: ${step.count} оброблено — ${status}`
}
</script>

<template>
	<div class="min-w-0 space-y-6 py-4">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold tracking-tight">Schedule Dashboard</h1>
			<button
				class="text-muted-foreground hover:text-foreground text-sm underline-offset-4
					hover:underline"
				@click="refresh"
			>
				Оновити
			</button>
		</div>

		<!-- Error banner -->
		<div
			v-if="error"
			class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700
				dark:border-red-700 dark:bg-red-950 dark:text-red-400"
		>
			{{ error }}
		</div>

		<!-- Summary cards -->
		<div v-if="summary" class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
			<div class="space-y-1 rounded-lg border p-4">
				<p class="text-muted-foreground text-xs">Статус</p>
				<UiBadge :variant="statusVariant(summary.currentStatus)" class="capitalize">
					{{ summary.currentStatus }}
				</UiBadge>
			</div>

			<div class="space-y-1 rounded-lg border p-4">
				<p class="text-muted-foreground text-xs">Прогрес</p>
				<p class="font-mono text-sm font-medium">
					<template v-if="summary.isRunning && summary.progress">
						{{ summary.progress.current }} / {{ summary.progress.total }} груп
					</template>
					<template v-else>—</template>
				</p>
			</div>

			<div class="space-y-1 rounded-lg border p-4">
				<p class="text-muted-foreground text-xs">Останній успіх</p>
				<p class="font-mono text-sm">
					{{ fmt(summary.lastSuccessfulRun?.finishedAt) }}
				</p>
			</div>

			<div class="space-y-1 rounded-lg border p-4">
				<p class="text-muted-foreground text-xs">Наступний запуск (cron)</p>
				<p class="font-mono text-sm">{{ fmt(summary.nextCronAt) }}</p>
			</div>
		</div>

		<!-- Runs table -->
		<div class="rounded-lg border">
			<div class="border-b px-4 py-3">
				<h2 class="font-medium">Останні запуски</h2>
			</div>
			<UiTable class="table-fixed">
				<UiTableHeader>
					<UiTableRow>
						<UiTableHead class="w-[15%] md:w-[13%]">ID</UiTableHead>
						<UiTableHead class="w-[12%] md:w-[8%]">Статус</UiTableHead>
						<UiTableHead class="hidden md:table-cell md:w-[7%]">Тригер</UiTableHead>
						<UiTableHead class="w-[22%] md:w-[14%]">Початок</UiTableHead>
						<UiTableHead class="w-[13%] md:w-[8%]">Тривалість</UiTableHead>
						<UiTableHead class="w-[18%] md:w-[10%]">Групи (провал)</UiTableHead>
						<UiTableHead class="hidden md:table-cell md:w-[9%]"
							>Подій всього</UiTableHead
						>
						<UiTableHead class="hidden md:table-cell md:w-[7%]">Видалено</UiTableHead>
						<UiTableHead class="hidden md:table-cell md:w-[15%]">Кроки</UiTableHead>
						<UiTableHead class="w-[20%] md:w-[9%]" />
					</UiTableRow>
				</UiTableHeader>
				<UiTableBody>
					<UiTableEmpty v-if="!runs.length" :colspan="10">Немає даних</UiTableEmpty>
					<UiTableRow
						v-for="run in runs"
						:key="run.id"
						:class="selectedRunId === run.id ? 'bg-muted/50' : ''"
					>
						<UiTableCell class="font-mono text-xs" :title="String(run.id)">
							{{ run.id }}
						</UiTableCell>
						<UiTableCell>
							<UiBadge :variant="statusVariant(run.status)" class="capitalize">
								{{ run.status }}
							</UiBadge>
						</UiTableCell>
						<UiTableCell class="hidden text-xs md:table-cell">{{
							run.trigger
						}}</UiTableCell>
						<UiTableCell class="text-xs">{{ fmt(run.startedAt) }}</UiTableCell>
						<UiTableCell class="font-mono text-xs">
							{{ duration(run.startedAt, run.finishedAt) }}
						</UiTableCell>
						<UiTableCell class="text-xs">
							{{ run.totalGroups }}
							<span v-if="run.failedGroups" class="text-destructive ml-1">
								({{ run.failedGroups }} ✗)
							</span>
						</UiTableCell>
						<UiTableCell class="hidden font-mono text-xs md:table-cell">{{
							run.totalEvents
						}}</UiTableCell>
						<UiTableCell class="hidden text-xs md:table-cell">
							<span
								:class="isRemovedSpike(run) ? 'text-destructive font-semibold' : ''"
							>
								{{ run.removedEvents }}
								<span
									v-if="isRemovedSpike(run)"
									title="Spike: >5% of events removed"
								>
									⚠
								</span>
							</span>
						</UiTableCell>
						<UiTableCell class="hidden text-xs md:table-cell">
							<span
								v-for="(step, name) in run.steps"
								:key="name"
								:title="stepTitle(String(name), step)"
								:class="
									step.ok
										? 'text-green-600 dark:text-green-400'
										: 'text-destructive'
								"
								class="mr-2 cursor-help"
							>
								{{ String(name)[0].toUpperCase() }}:{{ step.count
								}}{{ step.ok ? "" : "✗" }}
							</span>
						</UiTableCell>
						<UiTableCell>
							<button
								class="text-muted-foreground hover:text-foreground text-xs
									underline-offset-2 hover:underline"
								@click="fetchGroups(run.id)"
							>
								Групи
							</button>
						</UiTableCell>
					</UiTableRow>
				</UiTableBody>
			</UiTable>
		</div>

		<!-- Group results panel -->
		<div v-if="selectedRunId !== null" class="rounded-lg border">
			<div class="flex items-center justify-between border-b px-4 py-3">
				<h2 class="font-medium">Групи — запуск {{ selectedRunId }}</h2>
				<button
					class="text-muted-foreground hover:text-foreground text-xs"
					@click="selectedRunId = null"
				>
					✕
				</button>
			</div>
			<p v-if="loadingGroups" class="text-muted-foreground px-4 py-3 text-sm">
				Завантаження…
			</p>
			<UiTable v-else class="table-fixed">
				<UiTableHeader>
					<UiTableRow>
						<UiTableHead class="w-[12%]">Група ID</UiTableHead>
						<UiTableHead class="w-[10%]">Статус</UiTableHead>
						<UiTableHead class="w-[8%]">Подій</UiTableHead>
						<UiTableHead class="w-[8%]">Δ</UiTableHead>
						<UiTableHead class="w-[18%]">Час</UiTableHead>
						<UiTableHead class="w-[44%]">Помилка</UiTableHead>
					</UiTableRow>
				</UiTableHeader>
				<UiTableBody>
					<UiTableEmpty v-if="!selectedRunGroups.length" :colspan="6">
						Немає даних
					</UiTableEmpty>
					<UiTableRow v-for="g in selectedRunGroups" :key="g.groupId">
						<UiTableCell class="font-mono text-xs">{{ g.groupId }}</UiTableCell>
						<UiTableCell>
							<UiBadge
								:variant="g.status === 'success' ? 'success' : 'destructive'"
								class="capitalize"
							>
								{{ g.status }}
							</UiBadge>
						</UiTableCell>
						<UiTableCell class="font-mono text-xs">{{ g.eventsCount }}</UiTableCell>
						<UiTableCell
							class="font-mono text-xs"
							:class="deltaClass(g.eventsCount, g.prevEventsCount)"
						>
							{{ deltaLabel(g.eventsCount, g.prevEventsCount) || "—" }}
						</UiTableCell>
						<UiTableCell class="text-xs">{{ fmt(g.finishedAt) }}</UiTableCell>
						<UiTableCell class="text-destructive truncate text-xs">
							{{ g.error ?? "—" }}
						</UiTableCell>
					</UiTableRow>
				</UiTableBody>
			</UiTable>
		</div>

		<!-- Failures feed -->
		<div v-if="failures.length" class="rounded-lg border">
			<div class="border-b px-4 py-3">
				<h2 class="font-medium">
					Останні помилки груп
					<span class="text-muted-foreground ml-1 text-sm font-normal">
						(останні 50)
					</span>
				</h2>
			</div>
			<UiTable class="table-fixed">
				<UiTableHeader>
					<UiTableRow>
						<UiTableHead class="w-[18%]">Запуск ID</UiTableHead>
						<UiTableHead class="w-[12%]">Група ID</UiTableHead>
						<UiTableHead class="w-[20%]">Час</UiTableHead>
						<UiTableHead class="w-[50%]">Помилка</UiTableHead>
					</UiTableRow>
				</UiTableHeader>
				<UiTableBody>
					<UiTableRow v-for="f in failures" :key="`${f.runId}-${f.groupId}`">
						<UiTableCell class="font-mono text-xs">{{ f.runId }}</UiTableCell>
						<UiTableCell class="font-mono text-xs">{{ f.groupId }}</UiTableCell>
						<UiTableCell class="text-xs">{{ fmt(f.finishedAt) }}</UiTableCell>
						<UiTableCell class="text-destructive truncate text-xs">
							{{ f.error ?? "—" }}
						</UiTableCell>
					</UiTableRow>
				</UiTableBody>
			</UiTable>
		</div>

		<!-- Table sizes -->
		<div v-if="tableSizes.length" class="rounded-lg border">
			<div class="border-b px-4 py-3">
				<h2 class="font-medium">Розмір таблиць БД</h2>
			</div>
			<UiTable class="table-fixed">
				<UiTableHeader>
					<UiTableRow>
						<UiTableHead class="w-[60%]">Таблиця</UiTableHead>
						<UiTableHead class="w-[20%]">Рядків</UiTableHead>
						<UiTableHead class="w-[20%]">Розмір</UiTableHead>
					</UiTableRow>
				</UiTableHeader>
				<UiTableBody>
					<UiTableRow v-for="t in tableSizes" :key="t.tableName">
						<UiTableCell class="font-mono text-xs">{{ t.tableName }}</UiTableCell>
						<UiTableCell class="font-mono text-xs">
							{{ t.rowCount.toLocaleString("uk-UA") }}
						</UiTableCell>
						<UiTableCell class="font-mono text-xs">{{ t.sizePretty }}</UiTableCell>
					</UiTableRow>
				</UiTableBody>
			</UiTable>
		</div>
	</div>
</template>

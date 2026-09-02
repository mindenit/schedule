<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query"
import {
	dashSummaryOptions,
	dashRunsOptions,
	dashFailuresOptions,
	dashTableSizesOptions,
} from "~/queries/dash"
import { durationMs } from "~/composables/useDash"

definePageMeta({ layout: "dash" })
useHead({ title: "Dashboard" })
useServerSeoMeta({ robots: "noindex, nofollow" })

// ── Queries ───────────────────────────────────────────────────────────────────

const isRunning = ref(false)

const {
	data: summary,
	isPending: summaryPending,
	isFetching: summaryFetching,
	isError: summaryError,
} = useQuery(dashSummaryOptions(isRunning))

// Keep isRunning in sync so polling adapts
watchEffect(() => {
	isRunning.value = summary.value?.isRunning ?? false
})

const { data: runs, isPending: runsPending } = useQuery(dashRunsOptions(30))
const { data: failures, isPending: failuresPending } = useQuery(dashFailuresOptions(50))
const { data: tableSizes, isPending: tableSizesPending } = useQuery(dashTableSizesOptions())

// ── Refresh ───────────────────────────────────────────────────────────────────

const queryClient = useQueryClient()

async function refresh() {
	await queryClient.invalidateQueries({ queryKey: ["dash"] })
}

// ── Runs list ─────────────────────────────────────────────────────────────────

// Accordion: which run id is expanded (single)
const openRunId = ref<number | null>(null)

function toggleRun(id: number) {
	openRunId.value = openRunId.value === id ? null : id
}

// Sparkbar: max duration across loaded runs
const maxDurationMs = computed(() => {
	const list = runs.value ?? []
	return Math.max(1, ...list.map((r) => durationMs(r.startedAt, r.finishedAt)))
})

// Status filter
const statusFilter = ref<string>("all")
const filteredRuns = computed(() => {
	const list = runs.value ?? []
	if (statusFilter.value === "all") return list
	return list.filter((r) => r.status === statusFilter.value)
})

// Failure count badge
const failureCount = computed(() => failures.value?.length ?? 0)
</script>

<template>
	<div class="min-w-0 space-y-4 py-4">
		<!-- Hero -->
		<DashHero
			:summary="summary"
			:is-pending="summaryPending"
			:is-fetching="summaryFetching"
			:is-error="summaryError"
			:on-refresh="refresh"
		/>

		<!-- Metrics strip -->
		<DashMetrics
			:summary="summary"
			:runs="runs ?? []"
			:failures="failures ?? []"
			:is-pending="summaryPending || runsPending"
		/>

		<!-- Tabs -->
		<UiTabs default-value="runs">
			<UiTabsList class="grid w-full grid-cols-3 sm:inline-flex sm:w-fit">
				<UiTabsTrigger value="runs" class="w-full sm:w-auto">Прогони</UiTabsTrigger>
				<UiTabsTrigger value="failures" class="w-full gap-1.5 sm:w-auto">
					Провали
					<UiBadge
						v-if="failureCount"
						variant="destructive"
						class="h-4 min-w-4 px-1.5 py-0 text-[10px]"
						>{{ failureCount }}</UiBadge
					>
				</UiTabsTrigger>
				<UiTabsTrigger value="db" class="w-full sm:w-auto">База даних</UiTabsTrigger>
			</UiTabsList>

			<!-- Runs tab -->
			<UiTabsContent value="runs">
				<UiCard class="gap-0 overflow-hidden py-0">
					<!-- Filter bar -->
					<div class="flex items-center gap-3 border-b px-4 py-3">
						<p class="text-muted-foreground shrink-0 text-xs font-medium">Статус:</p>
						<UiSelect v-model="statusFilter">
							<UiSelectTrigger class="h-8 w-40 text-xs">
								<UiSelectValue />
							</UiSelectTrigger>
							<UiSelectContent>
								<UiSelectItem value="all">Всі</UiSelectItem>
								<UiSelectItem value="success">Успіх</UiSelectItem>
								<UiSelectItem value="partial">Частковий</UiSelectItem>
								<UiSelectItem value="failed">Помилка</UiSelectItem>
								<UiSelectItem value="running">Виконується</UiSelectItem>
							</UiSelectContent>
						</UiSelect>
					</div>

					<!-- Run list -->
					<template v-if="runsPending">
						<div class="divide-y">
							<div v-for="i in 8" :key="i" class="flex items-center gap-3 px-4 py-3">
								<UiSkeleton class="size-4 rounded-full" />
								<UiSkeleton class="h-3 w-12 rounded" />
								<UiSkeleton class="hidden h-2 w-20 rounded-full sm:block" />
								<UiSkeleton class="hidden h-3 w-16 rounded sm:block" />
							</div>
						</div>
					</template>

					<template v-else-if="!filteredRuns.length">
						<div class="py-10">
							<AppEmptyState
								icon="ph:list-dashes"
								title="Немає прогонів"
								description="Жодного прогону не відповідає фільтру."
								variant="inline"
							/>
						</div>
					</template>

					<template v-else>
						<DashRunItem
							v-for="run in filteredRuns"
							:key="run.id"
							:run="run"
							:max-duration-ms="maxDurationMs"
							:open="openRunId === run.id"
							@toggle="toggleRun(run.id)"
						/>
					</template>
				</UiCard>
			</UiTabsContent>

			<!-- Failures tab -->
			<UiTabsContent value="failures">
				<UiCard class="gap-0 py-4">
					<UiCardContent class="px-4 pb-0">
						<DashFailures :failures="failures ?? []" :is-pending="failuresPending" />
					</UiCardContent>
				</UiCard>
			</UiTabsContent>

			<!-- DB tab -->
			<UiTabsContent value="db">
				<UiCard class="gap-0 py-4">
					<UiCardContent class="px-4 pb-0">
						<DashTableSizes
							:table-sizes="tableSizes ?? []"
							:is-pending="tableSizesPending"
						/>
					</UiCardContent>
				</UiCard>
			</UiTabsContent>
		</UiTabs>
	</div>
</template>

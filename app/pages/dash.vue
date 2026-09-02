<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query"
import type { SyncRun } from "~/queries/dash"
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
	<div class="mx-auto w-full max-w-[1400px] space-y-4 py-4">
		<!-- Hero -->
		<DashHero
			:summary="summary"
			:is-pending="summaryPending"
			:is-fetching="summaryFetching"
			:is-error="summaryError"
			:failures-count="failureCount"
			:on-refresh="refresh"
		/>

		<!-- Tabs inside one shared card -->
		<UiTabs default-value="runs">
			<UiCard class="gap-0 overflow-hidden py-0">
				<!-- Tab bar — underline style, full width -->
				<UiTabsList
					:pill="false"
					class="relative w-full justify-start overflow-x-auto rounded-none border-b px-2"
				>
					<UiTabsTrigger
						value="runs"
						:pill="false"
						class="shrink-0 data-[state=active]:bg-transparent"
						>Прогони</UiTabsTrigger
					>
					<UiTabsTrigger
						value="failures"
						:pill="false"
						class="shrink-0 gap-1.5 data-[state=active]:bg-transparent"
					>
						Провали
						<UiBadge
							v-if="failureCount"
							variant="destructive"
							class="h-4 min-w-4 px-1.5 py-0 text-[10px]"
							>{{ failureCount }}</UiBadge
						>
					</UiTabsTrigger>
					<UiTabsTrigger
						value="groups"
						:pill="false"
						class="shrink-0 data-[state=active]:bg-transparent"
						>Групи</UiTabsTrigger
					>
					<UiTabsTrigger
						value="db"
						:pill="false"
						class="shrink-0 data-[state=active]:bg-transparent"
						>База даних</UiTabsTrigger
					>
					<UiTabsIndicator />
				</UiTabsList>

				<!-- Runs tab -->
				<UiTabsContent value="runs">
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
						<div class="py-6">
							<AppEmptyState
								icon="ph:list-dashes"
								title="Немає прогонів"
								description="Жодного прогону не відповідає фільтру."
								variant="inline"
							/>
						</div>
					</template>

					<template v-else>
						<!-- Column headers -->
						<div
							class="text-muted-foreground bg-muted/30 flex items-center gap-3
								border-b px-4 py-1.5 text-[11px] font-medium"
						>
							<span class="size-4 shrink-0" aria-hidden="true" />
							<span class="min-w-0 shrink-0">Початок</span>
							<span
								class="hidden shrink-0 md:block"
								style="width: 80px"
								aria-hidden="true"
							/>
							<span class="hidden w-20 shrink-0 sm:block">Тривалість</span>
							<span class="hidden shrink-0 md:inline-flex">Тригер</span>
							<span class="hidden shrink-0 sm:block">Групи</span>
							<span class="ml-auto" aria-hidden="true" />
							<span class="size-4 shrink-0" aria-hidden="true" />
						</div>
						<DashRunItem
							v-for="run in filteredRuns"
							:key="run.id"
							:run="run"
							:max-duration-ms="maxDurationMs"
							:open="openRunId === run.id"
							@toggle="toggleRun(run.id)"
						/>
					</template>
				</UiTabsContent>

				<!-- Failures tab -->
				<UiTabsContent value="failures" class="px-4 py-4">
					<DashFailures :failures="failures ?? []" :is-pending="failuresPending" />
				</UiTabsContent>

				<!-- Groups tab -->
				<UiTabsContent value="groups">
					<DashGroups :runs="(runs ?? []) as SyncRun[]" :runs-pending="runsPending" />
				</UiTabsContent>

				<!-- DB tab -->
				<UiTabsContent value="db">
					<div class="overflow-x-auto px-4 py-4">
						<DashTableSizes
							:table-sizes="tableSizes ?? []"
							:is-pending="tableSizesPending"
						/>
					</div>
				</UiTabsContent>
			</UiCard>
		</UiTabs>
	</div>
</template>

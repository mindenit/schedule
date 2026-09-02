<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import type { SyncRun } from "~/queries/dash"
import { dashRunGroupsOptions } from "~/queries/dash"
import { fmt, fmtShort, deltaLabel, deltaClass, groupLabel } from "~/composables/useDash"

const props = defineProps<{
	runs: SyncRun[]
	runsPending: boolean
}>()

// Selected run — default to the latest (first in the list, already sorted desc)
const selectedRunId = ref<number | null>(null)
watch(
	() => props.runs,
	(list) => {
		if (selectedRunId.value === null && list[0]) selectedRunId.value = list[0].id
	},
	{ immediate: true }
)
const effectiveRunId = computed(() => selectedRunId.value)

const { data: groups, isPending: groupsPending } = useQuery(dashRunGroupsOptions(effectiveRunId))

// Search
const search = ref("")
const filteredGroups = computed(() => {
	const list = groups.value ?? []
	const q = search.value.toLowerCase()
	if (!q) return list
	return list.filter(
		(g) => (g.groupName ?? "").toLowerCase().includes(q) || String(g.groupId).includes(q)
	)
})

// Status filter
const statusFilter = ref<"all" | "success" | "failed">("all")
const visibleGroups = computed(() => {
	if (statusFilter.value === "all") return filteredGroups.value
	return filteredGroups.value.filter((g) => g.status === statusFilter.value)
})

const failedCount = computed(() => (groups.value ?? []).filter((g) => g.status === "failed").length)
</script>

<template>
	<div>
		<!-- Toolbar -->
		<div class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
			<!-- Run selector -->
			<div class="flex w-full items-center gap-2 sm:w-auto">
				<p class="text-muted-foreground shrink-0 text-xs font-medium">Прогін:</p>
				<template v-if="runsPending">
					<UiSkeleton class="h-8 flex-1 rounded sm:w-48" />
				</template>
				<UiSelect v-else v-model="selectedRunId">
					<UiSelectTrigger class="h-8 min-w-0 flex-1 text-xs sm:w-56 sm:flex-none">
						<UiSelectValue placeholder="Оберіть прогін" />
					</UiSelectTrigger>
					<UiSelectContent>
						<UiSelectItem v-for="run in runs" :key="run.id" :value="run.id">
							{{ fmt(run.startedAt) }}
							<span class="text-muted-foreground ml-1">
								({{ run.status === "success" ? "✓" : "✗" }})
							</span>
						</UiSelectItem>
					</UiSelectContent>
				</UiSelect>
			</div>

			<!-- Status filter + search on same row -->
			<div class="flex w-full items-center gap-2 sm:w-auto">
				<!-- Status filter -->
				<UiSelect v-model="statusFilter">
					<UiSelectTrigger class="h-8 w-32 shrink-0 text-xs">
						<UiSelectValue />
					</UiSelectTrigger>
					<UiSelectContent>
						<UiSelectItem value="all">Всі</UiSelectItem>
						<UiSelectItem value="success">Успіх</UiSelectItem>
						<UiSelectItem value="failed">
							Помилки
							<UiBadge
								v-if="failedCount"
								variant="destructive"
								class="ml-1.5 h-4 min-w-4 px-1.5 py-0 text-[10px]"
							>
								{{ failedCount }}
							</UiBadge>
						</UiSelectItem>
					</UiSelectContent>
				</UiSelect>

				<!-- Search -->
				<UiInput
					v-model="search"
					placeholder="Пошук групи…"
					class="h-8 min-w-0 flex-1 text-xs sm:w-44 sm:flex-none"
				/>

				<!-- Count -->
				<p class="text-muted-foreground ml-auto shrink-0 text-xs">
					{{ visibleGroups.length }} / {{ groups?.length ?? "…" }}
				</p>
			</div>
		</div>

		<!-- Loading skeletons -->
		<template v-if="groupsPending">
			<div class="divide-y">
				<div v-for="i in 10" :key="i" class="flex items-center gap-3 px-4 py-2.5">
					<UiSkeleton class="size-3.5 rounded-full" />
					<UiSkeleton class="h-3 w-28 rounded" />
					<UiSkeleton class="ml-auto h-3 w-16 rounded" />
				</div>
			</div>
		</template>

		<!-- Empty state -->
		<template v-else-if="!visibleGroups.length">
			<div class="py-10">
				<AppEmptyState
					icon="ph:users"
					title="Немає груп"
					description="Жодної групи не відповідає фільтру."
					variant="inline"
				/>
			</div>
		</template>

		<!-- Column headers -->
		<div
			v-else
			class="text-muted-foreground bg-muted/30 flex items-center gap-3 border-b px-4 py-1.5
				text-[11px] font-medium"
		>
			<span class="size-3.5 shrink-0" />
			<span class="min-w-0 flex-1">Група</span>
			<span class="font-sans">Подій</span>
			<span class="w-24 shrink-0 text-right">Оновлено</span>
		</div>

		<!-- Group rows — content-visibility:auto for 1000+ rows -->
		<div class="divide-y">
			<div
				v-for="g in visibleGroups"
				:key="g.groupId"
				class="flex items-center gap-3 px-4 py-2 text-xs"
				style="content-visibility: auto; contain-intrinsic-size: auto 36px"
			>
				<!-- Status dot -->
				<AppIcon
					:name="g.status === 'success' ? 'ph:check-circle-fill' : 'ph:x-circle-fill'"
					class="size-3.5 shrink-0"
					:class="g.status === 'success' ? 'text-green-500' : 'text-destructive'"
				/>

				<!-- Group name -->
				<span class="min-w-0 flex-1 truncate font-medium">{{ groupLabel(g) }}</span>

				<!-- Events + delta -->
				<span class="font-mono" :class="deltaClass(g.eventsCount, g.prevEventsCount)">
					{{ g.eventsCount }}
					<span v-if="deltaLabel(g.eventsCount, g.prevEventsCount) !== '='">
						{{ deltaLabel(g.eventsCount, g.prevEventsCount) }}
					</span>
				</span>

				<!-- Updated at -->
				<span class="text-muted-foreground w-24 shrink-0 text-right font-mono">
					{{ fmtShort(g.finishedAt) }}
				</span>

				<!-- Error (failed groups only) -->
				<span
					v-if="g.error"
					class="text-destructive max-w-[200px] truncate"
					:title="g.error"
				>
					{{ g.error }}
				</span>
			</div>
		</div>
	</div>
</template>

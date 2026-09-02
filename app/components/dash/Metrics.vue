<script setup lang="ts">
import type { DashSummary, SyncRun, FailedGroupEntry } from "~/queries/dash"

defineProps<{
	summary: DashSummary | undefined
	runs: SyncRun[]
	failures: FailedGroupEntry[]
	isPending: boolean
}>()
</script>

<template>
	<div class="flex flex-wrap gap-3">
		<!-- Total runs -->
		<div class="bg-card flex items-center gap-3 rounded-lg border px-4 py-2.5">
			<AppIcon name="ph:repeat" class="text-muted-foreground size-4 shrink-0" />
			<div>
				<p class="text-muted-foreground mb-0.5 text-[11px] leading-none">Прогонів</p>
				<p v-if="isPending" class="font-mono text-sm font-semibold">
					<UiSkeleton class="h-4 w-10 rounded" />
				</p>
				<p v-else class="font-mono text-sm font-semibold">
					{{ summary?.totalRuns ?? "—" }}
				</p>
			</div>
		</div>

		<!-- Failed groups (from current failures feed) -->
		<div
			class="flex items-center gap-3 rounded-lg border px-4 py-2.5"
			:class="failures.length ? 'border-destructive/40 bg-destructive/5' : 'bg-card'"
		>
			<AppIcon
				name="ph:warning"
				class="size-4 shrink-0"
				:class="failures.length ? 'text-destructive' : 'text-muted-foreground'"
			/>
			<div>
				<p class="text-muted-foreground mb-0.5 text-[11px] leading-none">Провалів груп</p>
				<p v-if="isPending" class="font-mono text-sm font-semibold">
					<UiSkeleton class="h-4 w-10 rounded" />
				</p>
				<p
					v-else
					class="font-mono text-sm font-semibold"
					:class="failures.length ? 'text-destructive' : ''"
				>
					{{ failures.length }}
				</p>
			</div>
		</div>

		<!-- Total events from last run -->
		<div class="bg-card flex items-center gap-3 rounded-lg border px-4 py-2.5">
			<AppIcon name="ph:calendar" class="text-muted-foreground size-4 shrink-0" />
			<div>
				<p class="text-muted-foreground mb-0.5 text-[11px] leading-none">
					Подій (останній прогін)
				</p>
				<p v-if="isPending" class="font-mono text-sm font-semibold">
					<UiSkeleton class="h-4 w-16 rounded" />
				</p>
				<p v-else class="font-mono text-sm font-semibold">
					{{ summary?.lastRun?.totalEvents?.toLocaleString("uk-UA") ?? "—" }}
				</p>
			</div>
		</div>
	</div>
</template>

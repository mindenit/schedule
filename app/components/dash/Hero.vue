<script setup lang="ts">
import type { DashSummary } from "~/queries/dash"
import { statusVariant, STATUS_LABELS, fmt, fmtRelative } from "~/composables/useDash"

defineProps<{
	summary: DashSummary | undefined
	isPending: boolean
	isFetching: boolean
	onRefresh: () => void
}>()
</script>

<template>
	<UiCard class="gap-4 py-5">
		<UiCardHeader class="flex-row items-center justify-between gap-4 space-y-0 px-5 py-0">
			<div class="flex min-w-0 items-center gap-3">
				<!-- Live pulse dot -->
				<span class="relative flex size-2.5 shrink-0">
					<span
						v-if="summary?.isRunning"
						class="absolute inline-flex h-full w-full animate-ping rounded-full
							bg-blue-400 opacity-75"
					/>
					<span
						class="relative inline-flex size-2.5 rounded-full"
						:class="{
							'bg-blue-500': summary?.isRunning,
							'bg-green-500': summary?.currentStatus === 'success',
							'bg-yellow-500': summary?.currentStatus === 'partial',
							'bg-red-500': summary?.currentStatus === 'failed',
							'bg-muted-foreground': !summary || summary.currentStatus === 'unknown',
						}"
					/>
				</span>

				<!-- Status text -->
				<template v-if="isPending">
					<UiSkeleton class="h-5 w-40 rounded" />
				</template>
				<template v-else-if="summary">
					<h1 class="truncate text-base font-semibold">
						{{ STATUS_LABELS[summary.currentStatus] ?? summary.currentStatus }}
					</h1>
					<UiBadge :variant="statusVariant(summary.currentStatus)" class="shrink-0">
						{{ STATUS_LABELS[summary.currentStatus] ?? summary.currentStatus }}
					</UiBadge>
				</template>
			</div>

			<!-- Refresh button -->
			<UiButton
				variant="outline"
				size="sm"
				:disabled="isFetching"
				class="shrink-0 gap-1.5"
				@click="onRefresh"
			>
				<AppIcon
					name="ph:arrows-clockwise"
					class="size-4 transition-transform"
					:class="{ 'animate-spin': isFetching }"
				/>
				Оновити
			</UiButton>
		</UiCardHeader>

		<UiCardContent class="space-y-3 px-5 pb-0">
			<!-- Progress bar (only while running) -->
			<template v-if="summary?.isRunning && summary.progress">
				<div class="space-y-1">
					<div class="text-muted-foreground flex justify-between text-xs">
						<span>Прогрес</span>
						<span class="font-mono">
							{{ summary.progress.current }} / {{ summary.progress.total }} груп
						</span>
					</div>
					<UiProgress
						:model-value="(summary.progress.current / summary.progress.total) * 100"
						class="h-2"
					/>
				</div>
			</template>

			<!-- Meta row -->
			<div
				v-if="!isPending && summary"
				class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs"
			>
				<span v-if="summary.lastSuccessfulRun">
					Останній успіх:
					<span class="text-foreground font-medium">
						{{ fmtRelative(summary.lastSuccessfulRun.finishedAt) }}
					</span>
				</span>
				<span v-if="summary.nextCronAt">
					Наступний cron:
					<span class="text-foreground font-mono font-medium">
						{{ fmt(summary.nextCronAt) }}
					</span>
				</span>
			</div>

			<!-- Skeleton meta -->
			<template v-if="isPending">
				<div class="flex gap-4">
					<UiSkeleton class="h-4 w-32 rounded" />
					<UiSkeleton class="h-4 w-40 rounded" />
				</div>
			</template>
		</UiCardContent>
	</UiCard>
</template>

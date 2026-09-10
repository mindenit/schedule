<script setup lang="ts">
import type { DashSummary } from "~/queries/dash"
import { STATUS_LABELS, fmt, fmtRelative } from "~/composables/useDash"

defineProps<{
	summary: DashSummary | undefined
	isPending: boolean
	isFetching: boolean
	isError: boolean
	failuresCount: number
	onRefresh: () => void
}>()
</script>

<template>
	<UiCard class="gap-4 py-5">
		<UiCardHeader class="flex items-center justify-between gap-4 space-y-0 px-5 py-0">
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
					name="ph:arrows-clockwise-bold"
					class="size-4 transition-transform"
					:class="{ 'animate-spin': isFetching }"
				/>
				Оновити
			</UiButton>
		</UiCardHeader>

		<UiCardContent class="space-y-3 px-5 pb-0">
			<!-- Error state -->
			<UiAlert v-if="isError && !isPending" variant="destructive">
				<AppIcon name="ph:warning-circle-bold" class="size-4" />
				<UiAlertTitle>Помилка завантаження</UiAlertTitle>
				<UiAlertDescription>
					Не вдалося отримати дані з сервера. Спробуйте оновити.
				</UiAlertDescription>
			</UiAlert>

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
		<!-- Stats footer -->
		<div class="border-t px-5 pt-4">
			<div class="grid grid-cols-3 gap-3 sm:flex sm:gap-0 sm:divide-x">
				<!-- Прогонів -->
				<div class="sm:pr-4">
					<p class="text-muted-foreground mb-0.5 text-xs">Прогонів</p>
					<UiSkeleton v-if="isPending" class="h-5 w-10 rounded" />
					<p v-else class="font-mono text-base font-semibold">
						{{ summary?.totalRuns ?? "—" }}
					</p>
				</div>
				<!-- Провалів груп -->
				<div class="sm:px-4">
					<p class="text-muted-foreground mb-0.5 text-xs">Провалів груп</p>
					<UiSkeleton v-if="isPending" class="h-5 w-10 rounded" />
					<p
						v-else
						class="font-mono text-base font-semibold"
						:class="failuresCount ? 'text-destructive' : ''"
					>
						{{ failuresCount }}
					</p>
				</div>
				<!-- Подій -->
				<div class="sm:pl-4">
					<p class="text-muted-foreground mb-0.5 text-xs">Подій</p>
					<UiSkeleton v-if="isPending" class="h-5 w-16 rounded" />
					<p v-else class="font-mono text-base font-semibold">
						{{ summary?.lastRun?.totalEvents?.toLocaleString("uk-UA") ?? "—" }}
					</p>
				</div>
			</div>
		</div>
	</UiCard>
</template>

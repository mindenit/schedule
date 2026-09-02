<script setup lang="ts">
import type { FailedGroupEntry } from "~/queries/dash"
import { fmt, groupLabel } from "~/composables/useDash"
import { useClipboard } from "@vueuse/core"

defineProps<{
	failures: FailedGroupEntry[]
	isPending: boolean
}>()

const { copy } = useClipboard({ legacy: true })

// Copied tracking per entry
const copiedId = ref<string | null>(null)

function copyError(key: string, text: string) {
	copy(text)
	copiedId.value = key
	setTimeout(() => (copiedId.value = null), 2000)
}
</script>

<template>
	<div class="space-y-3 pt-2">
		<!-- Skeleton -->
		<template v-if="isPending">
			<div class="space-y-3">
				<UiSkeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-lg" />
			</div>
		</template>

		<!-- Empty state -->
		<template v-else-if="!failures.length">
			<AppEmptyState
				icon="ph:check-circle"
				title="Помилок немає"
				description="За останні прогони провалів груп не зафіксовано."
				variant="card"
			/>
		</template>

		<!-- Failure cards -->
		<template v-else>
			<p class="text-muted-foreground text-xs">Останні {{ failures.length }} провалів</p>
			<div class="space-y-2">
				<div
					v-for="f in failures"
					:key="`${f.runId}-${f.groupId}`"
					class="border-destructive/30 bg-destructive/5 rounded-lg border p-3"
				>
					<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
						<div class="flex min-w-0 items-center gap-2">
							<AppIcon
								name="ph:x-circle-fill"
								class="text-destructive size-4 shrink-0"
							/>
							<span class="truncate text-sm font-semibold">
								{{ groupLabel(f) }}
							</span>
						</div>
						<div class="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
							<span
								>Прогін <span class="font-mono">#{{ f.runId }}</span></span
							>
							<span class="font-mono">{{ fmt(f.finishedAt) }}</span>
						</div>
					</div>

					<div
						v-if="f.error"
						class="bg-muted/50 text-destructive relative rounded border p-2 font-mono
							text-xs leading-relaxed"
					>
						<pre class="break-all whitespace-pre-wrap">{{ f.error }}</pre>
						<button
							class="text-muted-foreground hover:text-foreground absolute top-1.5
								right-1.5 transition-colors"
							:title="
								copiedId === `${f.runId}-${f.groupId}`
									? 'Скопійовано!'
									: 'Копіювати'
							"
							@click="copyError(`${f.runId}-${f.groupId}`, f.error ?? '')"
						>
							<AppIcon
								:name="
									copiedId === `${f.runId}-${f.groupId}` ? 'ph:check' : 'ph:copy'
								"
								class="size-3.5"
							/>
						</button>
					</div>
					<p v-else class="text-muted-foreground text-xs">
						Повідомлення про помилку відсутнє
					</p>
				</div>
			</div>
		</template>
	</div>
</template>

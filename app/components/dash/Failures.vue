<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query"
import type { FailedGroupEntry } from "~/queries/dash"
import { dismissFailure, refetchGroup } from "~/queries/dash"
import { fmt, groupLabel } from "~/composables/useDash"
import { useClipboard } from "@vueuse/core"

defineProps<{
	failures: FailedGroupEntry[]
	isPending: boolean
}>()

const { copy } = useClipboard({ legacy: true })
const queryClient = useQueryClient()

// Copied tracking per entry
const copiedId = ref<string | null>(null)

function copyError(key: string, text: string) {
	copy(text)
	copiedId.value = key
	setTimeout(() => (copiedId.value = null), 2000)
}

// Per-row busy tracking for dismiss/refetch actions
const busyKeys = ref(new Set<string>())

async function handleDismiss(f: FailedGroupEntry) {
	const key = `${f.runId}-${f.groupId}`
	busyKeys.value.add(key)
	try {
		const result = await dismissFailure(f.runId, f.groupId)
		if (result?.dismissed) {
			useSonner.success("Приховано", { description: groupLabel(f) })
		}
	} catch {
		useSonner.error("Не вдалося приховати", {
			description: "Запис уже міг змінитися. Оновлюємо список.",
		})
	} finally {
		busyKeys.value.delete(key)
		await queryClient.invalidateQueries({ queryKey: ["dash"] })
	}
}

async function handleRefetch(f: FailedGroupEntry) {
	const key = `${f.runId}-${f.groupId}`
	busyKeys.value.add(key)
	try {
		const result = await refetchGroup(f.groupId)
		if (result?.ok) {
			useSonner.success("Перезапит виконано", {
				description: `${groupLabel(f)} — ${result.eventsCount} подій`,
			})
		} else {
			useSonner.error("Перезапит не вдався", { description: result?.error ?? groupLabel(f) })
		}
	} catch {
		useSonner.error("Перезапит не вдався", { description: groupLabel(f) })
	} finally {
		busyKeys.value.delete(key)
		await queryClient.invalidateQueries({ queryKey: ["dash"] })
	}
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
							<UiButton
								variant="outline"
								size="sm"
								class="h-6 gap-1 px-2 text-[11px]"
								:disabled="busyKeys.has(`${f.runId}-${f.groupId}`)"
								@click="handleRefetch(f)"
							>
								<AppIcon
									name="ph:arrows-clockwise"
									class="size-3"
									:class="{
										'animate-spin': busyKeys.has(`${f.runId}-${f.groupId}`),
									}"
								/>
								Перезапит
							</UiButton>
							<UiButton
								variant="ghost"
								size="sm"
								class="h-6 gap-1 px-2 text-[11px]"
								:disabled="busyKeys.has(`${f.runId}-${f.groupId}`)"
								@click="handleDismiss(f)"
							>
								<AppIcon name="ph:eye-slash" class="size-3" />
								Приховати
							</UiButton>
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
							:aria-label="
								copiedId === `${f.runId}-${f.groupId}`
									? 'Скопійовано!'
									: 'Копіювати помилку'
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

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import type { SyncRun } from "~/queries/dash"
import { dashRunGroupsOptions } from "~/queries/dash"
import {
	TRIGGER_LABELS,
	STEP_LABELS,
	fmt,
	duration,
	durationMs,
	deltaLabel,
	deltaClass,
	isRemovedSpike,
	groupLabel,
} from "~/composables/useDash"
import { useClipboard } from "@vueuse/core"

const props = defineProps<{
	run: SyncRun
	/** max duration ms across all loaded runs — for sparkbar scaling */
	maxDurationMs: number
	open: boolean
}>()

const emit = defineEmits<{
	toggle: []
}>()

// Groups query — enabled only when accordion is open
const runId = computed(() => (props.open ? props.run.id : null))
const { data: groups, isPending: groupsPending } = useQuery(dashRunGroupsOptions(runId))

// Sparkbar width %
const sparkWidth = computed(() => {
	if (!props.maxDurationMs || !props.run.finishedAt) return 0
	const ms = durationMs(props.run.startedAt, props.run.finishedAt)
	return Math.max(2, Math.round((ms / props.maxDurationMs) * 100))
})

// Groups split
const failedGroups = computed(() => groups.value?.filter((g) => g.status === "failed") ?? [])
const successGroups = computed(() => groups.value?.filter((g) => g.status === "success") ?? [])

// Local search for success groups
const successSearch = ref("")
const filteredSuccess = computed(() => {
	const q = successSearch.value.toLowerCase()
	if (!q) return successGroups.value
	return successGroups.value.filter(
		(g) => (g.groupName ?? "").toLowerCase().includes(q) || String(g.groupId).includes(q)
	)
})

// Whether success section is expanded
const showSuccess = ref(false)

// Clipboard helper for errors
const { copy, copied } = useClipboard({ legacy: true })
</script>

<template>
	<div class="border-b last:border-b-0">
		<!-- Collapsed row / trigger -->
		<button
			class="hover:bg-muted/40 flex w-full items-center gap-3 px-4 py-3 text-left
				transition-colors"
			@click="emit('toggle')"
		>
			<!-- Status indicator -->
			<span class="shrink-0">
				<AppIcon
					v-if="run.status === 'success'"
					name="ph:check-circle-fill"
					class="size-4 text-green-500"
				/>
				<AppIcon
					v-else-if="run.status === 'running'"
					name="ph:spinner"
					class="size-4 animate-spin text-blue-500"
				/>
				<AppIcon
					v-else-if="run.status === 'partial'"
					name="ph:warning-fill"
					class="size-4 text-yellow-500"
				/>
				<AppIcon v-else name="ph:x-circle-fill" class="text-destructive size-4" />
			</span>

			<!-- Run ID -->
			<span class="text-muted-foreground w-12 shrink-0 font-mono text-xs">
				#{{ run.id }}
			</span>

			<!-- Sparkbar (duration visual) -->
			<span
				class="bg-muted relative hidden h-2 shrink-0 rounded-full sm:block"
				style="width: 80px"
				aria-hidden="true"
			>
				<span
					class="absolute inset-y-0 left-0 rounded-full transition-[width]"
					:class="{
						'bg-green-500/60': run.status === 'success',
						'bg-yellow-500/60': run.status === 'partial',
						'bg-destructive/60': run.status === 'failed',
						'bg-blue-500/60': run.status === 'running',
					}"
					:style="{ width: `${sparkWidth}%` }"
				/>
			</span>

			<!-- Duration -->
			<span class="hidden w-20 shrink-0 font-mono text-xs sm:block">
				{{ duration(run.startedAt, run.finishedAt) }}
			</span>

			<!-- Trigger badge -->
			<UiBadge variant="secondary" class="hidden shrink-0 text-[10px] md:inline-flex">
				{{ TRIGGER_LABELS[run.trigger] ?? run.trigger }}
			</UiBadge>

			<!-- Groups summary -->
			<span class="text-muted-foreground hidden shrink-0 text-xs sm:block">
				<span v-if="run.failedGroups" class="text-destructive font-medium">
					{{ run.failedGroups }} ✗
				</span>
				<span v-else>{{ run.totalGroups }} груп</span>
			</span>

			<!-- Events delta / spike -->
			<span
				v-if="isRemovedSpike(run)"
				class="text-destructive mr-2 ml-auto shrink-0 text-xs font-semibold"
				title="Видалено >5% подій"
			>
				⚠ −{{ run.removedEvents }}
			</span>
			<span v-else class="ml-auto" />

			<!-- Chevron -->
			<AppIcon
				name="ph:caret-down"
				class="text-muted-foreground size-4 shrink-0 transition-transform"
				:class="{ 'rotate-180': open }"
			/>
		</button>

		<!-- Expanded content -->
		<div v-if="open" class="space-y-4 px-4 pb-4">
			<!-- Meta row -->
			<div class="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs">
				<span>
					Початок:
					<span class="text-foreground font-mono">{{ fmt(run.startedAt) }}</span>
				</span>
				<span>
					Тривалість:
					<span class="text-foreground font-mono">
						{{ duration(run.startedAt, run.finishedAt) }}
					</span>
				</span>
				<span>
					Подій:
					<span class="text-foreground font-mono">{{ run.totalEvents }}</span>
				</span>
				<span v-if="run.removedEvents">
					Видалено:
					<span
						class="font-mono"
						:class="
							isRemovedSpike(run)
								? 'text-destructive font-semibold'
								: 'text-foreground'
						"
					>
						{{ run.removedEvents }}
						{{ isRemovedSpike(run) ? "⚠" : "" }}
					</span>
				</span>
			</div>

			<!-- Steps timeline -->
			<div class="bg-muted/30 space-y-2 rounded-lg border p-3">
				<p class="text-muted-foreground mb-2 text-xs font-medium">Кроки синхронізації</p>
				<div v-for="(step, key) in run.steps" :key="key" class="flex items-start gap-2.5">
					<AppIcon
						:name="step.ok ? 'ph:check-circle-fill' : 'ph:x-circle-fill'"
						class="mt-0.5 size-4 shrink-0"
						:class="step.ok ? 'text-green-500' : 'text-destructive'"
					/>
					<div class="min-w-0">
						<span class="text-sm font-medium">
							{{ STEP_LABELS[String(key)] ?? String(key) }}
						</span>
						<span class="text-muted-foreground ml-1.5 text-xs">
							{{ step.count }} оброблено
						</span>
						<span
							v-if="!step.ok && step.error"
							class="text-destructive mt-0.5 block text-xs"
						>
							{{ step.error }}
						</span>
					</div>
				</div>
			</div>

			<!-- Groups section -->
			<template v-if="groupsPending">
				<div class="space-y-2">
					<UiSkeleton class="h-4 w-32 rounded" />
					<UiSkeleton class="h-20 w-full rounded" />
				</div>
			</template>

			<template v-else-if="groups">
				<!-- Failed groups — always shown first, expanded -->
				<div v-if="failedGroups.length" class="space-y-2">
					<p class="text-destructive flex items-center gap-1.5 text-xs font-medium">
						<AppIcon name="ph:x-circle" class="size-3.5" />
						Провали ({{ failedGroups.length }})
					</p>
					<div class="space-y-2">
						<div
							v-for="g in failedGroups"
							:key="g.groupId"
							class="border-destructive/30 bg-destructive/5 rounded-lg border p-3"
						>
							<div class="mb-1.5 flex items-center justify-between gap-2">
								<span class="text-sm font-medium">{{ groupLabel(g) }}</span>
								<span class="text-muted-foreground font-mono text-xs">
									{{ fmt(g.finishedAt) }}
								</span>
							</div>
							<div
								v-if="g.error"
								class="bg-muted/50 text-destructive relative rounded border p-2
									font-mono text-xs leading-relaxed"
							>
								<pre class="break-all whitespace-pre-wrap">{{ g.error }}</pre>
								<button
									class="text-muted-foreground hover:text-foreground absolute
										top-1.5 right-1.5 transition-colors"
									:title="copied ? 'Скопійовано!' : 'Копіювати'"
									@click="copy(g.error ?? '')"
								>
									<AppIcon
										:name="copied ? 'ph:check' : 'ph:copy'"
										class="size-3.5"
									/>
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Successful groups — collapsed by default -->
				<div v-if="successGroups.length" class="space-y-2">
					<button
						class="text-muted-foreground hover:text-foreground flex items-center gap-1.5
							text-xs font-medium transition-colors"
						@click="showSuccess = !showSuccess"
					>
						<AppIcon
							name="ph:caret-right"
							class="size-3.5 transition-transform"
							:class="{ 'rotate-90': showSuccess }"
						/>
						<AppIcon name="ph:check-circle" class="size-3.5 text-green-500" />
						{{ successGroups.length }} груп успішно
					</button>

					<template v-if="showSuccess">
						<UiInput
							v-model="successSearch"
							placeholder="Пошук групи…"
							class="h-8 text-sm"
						/>
						<div class="max-h-64 divide-y overflow-y-auto rounded-lg border">
							<div
								v-if="!filteredSuccess.length"
								class="text-muted-foreground py-6 text-center text-xs"
							>
								Нічого не знайдено
							</div>
							<div
								v-for="g in filteredSuccess"
								:key="g.groupId"
								class="flex items-center justify-between px-3 py-2 text-xs"
							>
								<span class="font-medium">{{ groupLabel(g) }}</span>
								<span
									class="font-mono"
									:class="deltaClass(g.eventsCount, g.prevEventsCount)"
								>
									{{ g.eventsCount }}
									<span
										v-if="deltaLabel(g.eventsCount, g.prevEventsCount) !== '='"
									>
										{{ deltaLabel(g.eventsCount, g.prevEventsCount) }}
									</span>
								</span>
							</div>
						</div>
					</template>
				</div>
			</template>
		</div>
	</div>
</template>

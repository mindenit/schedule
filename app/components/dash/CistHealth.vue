<script setup lang="ts">
import type { CistHealth, CistKeyHealth } from "~/queries/dash"
import { fmtRelative } from "~/composables/useDash"

defineProps<{
	health: CistHealth | undefined
	isPending: boolean
	isFetching: boolean
	isError: boolean
}>()

const KEY_STATUS_LABELS: Record<CistKeyHealth["status"], string> = {
	valid: "дійсний",
	rejected: "відхилено",
	unknown: "невідомо",
}

const KEY_STATUS_CLASSES: Record<CistKeyHealth["status"], string> = {
	valid: "text-green-500",
	rejected: "text-destructive",
	unknown: "text-muted-foreground",
}

function keyLabel(key: CistKeyHealth) {
	const status = KEY_STATUS_LABELS[key.status]
	return key.reason ? `${status} (${key.reason})` : status
}
</script>

<template>
	<UiCard class="gap-3 py-4">
		<UiCardContent class="space-y-3 px-5">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-sm font-semibold">Сервери CIST</h2>
				<span v-if="health && !isFetching" class="text-muted-foreground text-xs">
					Перевірено: {{ fmtRelative(health.checkedAt) }}
				</span>
				<AppIcon
					v-else-if="isFetching"
					name="ph:arrows-clockwise"
					class="text-muted-foreground size-4 animate-spin"
				/>
			</div>

			<UiAlert v-if="isError && !isFetching" variant="destructive">
				<AppIcon name="ph:warning-circle" class="size-4" />
				<UiAlertTitle>Не вдалося перевірити CIST</UiAlertTitle>
				<UiAlertDescription>Спробуйте оновити.</UiAlertDescription>
			</UiAlert>

			<div v-if="isPending" class="space-y-2">
				<UiSkeleton class="h-5 w-full rounded" />
				<UiSkeleton class="h-5 w-full rounded" />
			</div>

			<template v-else-if="health">
				<UiAlert v-if="health.ambiguous" variant="destructive">
					<AppIcon name="ph:warning-circle" class="size-4" />
					<UiAlertTitle>Усі ключі відхилено</UiAlertTitle>
					<UiAlertDescription>
						Ключі відкликано або збій авторизації на боці CIST.
					</UiAlertDescription>
				</UiAlert>

				<ul class="divide-y">
					<li
						v-for="server in health.servers"
						:key="server.host"
						class="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm first:pt-0
							last:pb-0"
					>
						<span class="flex min-w-0 items-center gap-2">
							<span
								class="size-2.5 shrink-0 rounded-full"
								:class="server.up ? 'bg-green-500' : 'bg-red-500'"
							/>
							<span class="truncate font-mono">{{ server.host }}</span>
						</span>
						<span class="text-muted-foreground text-xs">
							{{ server.up ? `${server.latencyMs ?? "—"} мс` : "недоступний" }}
						</span>
						<span class="ml-auto flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
							<span v-for="key in server.keys" :key="key.index">
								Ключ {{ key.index }}:
								<span :class="KEY_STATUS_CLASSES[key.status]">{{
									keyLabel(key)
								}}</span>
							</span>
						</span>
					</li>
				</ul>
			</template>
		</UiCardContent>
	</UiCard>
</template>

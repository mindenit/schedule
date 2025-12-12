<script setup lang="ts">
import type { TEventType } from "~/layers/calendar/types"
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "~/layers/calendar/constants"

interface Props {
	startTime: string
	endTime: string
	auditorium: string
	type: TEventType
	name: string
}

defineProps<Props>()
</script>

<template>
	<div
		class="group bg-card relative overflow-hidden rounded-lg border p-2.5 shadow-sm transition-all
			hover:shadow-md"
	>
		<div class="flex items-start gap-2.5">
			<div class="flex flex-col items-center gap-0.5 pt-0.5">
				<span class="text-xs leading-none font-bold tabular-nums">{{ startTime }}</span>
				<div :class="cn('h-5 w-0.5 rounded-full', EVENT_TYPE_COLORS[type as TEventType])"></div>
				<span class="text-xs leading-none font-bold tabular-nums">{{ endTime }}</span>
			</div>

			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<span class="line-clamp-2 text-sm leading-tight font-semibold">{{ name }}</span>
				<div class="text-muted-foreground flex items-center gap-1.5 text-xs">
					<div class="flex items-center gap-1">
						<AppIcon name="lucide:map-pin" class="flex-shrink-0" />
						<span class="truncate">{{ auditorium }}</span>
					</div>
					<span class="flex-shrink-0">•</span>
					<span class="flex-shrink-0 font-medium">{{ EVENT_TYPE_LABELS[type as TEventType] }}</span>
				</div>
			</div>
		</div>

		<div :class="cn('absolute inset-y-0 left-0 w-1', EVENT_TYPE_COLORS[type as TEventType])"></div>
	</div>
</template>

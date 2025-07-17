<script setup lang="ts">
import type { TEventType } from "~/layers/calendar/types"
import { EVENT_TYPE_LABELS, EVENT_TYPE_BORDERS } from "~/layers/calendar/constants"

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
	<div class="flex items-stretch gap-2">
		<div class="flex flex-col justify-center gap-[6px]">
			<span class="text-base font-bold tabular-nums">{{ startTime }}</span>
			<span class="text-base font-bold tabular-nums">{{ endTime }}</span>
		</div>

		<div :class="cn('w-[2px] rounded-xl border', EVENT_TYPE_BORDERS[type as TEventType])"></div>

		<div class="flex flex-col justify-between gap-[6px]">
			<span class="text-muted-foreground text-sm">
				{{ auditorium }} <Icon name="lucide:dot" /> {{ EVENT_TYPE_LABELS[type as TEventType] }}
			</span>
			<span class="text-base">{{ name }}</span>
		</div>
	</div>
</template>

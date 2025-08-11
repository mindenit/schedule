<script setup lang="ts">
import type { TEventType } from "~/layers/calendar/types"
import { EVENT_TYPE_BORDERS } from "~/layers/calendar/constants"

interface Props {
	startTime: string
	endTime: string
	auditorium: string
	type: TEventType
	name: string
}

defineProps<Props>()
const { t } = useI18n()
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
				{{ auditorium }} <AppIcon name="lucide:dot" /> {{ t(`event_types.${type}`) }}
			</span>
			<span class="text-base">{{ name }}</span>
		</div>
	</div>
</template>

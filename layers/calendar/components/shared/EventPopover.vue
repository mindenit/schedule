<script setup lang="ts">
import { storeToRefs } from "pinia"
import type { ICalendarEvent } from "../types"

interface Props {
	event: ICalendarEvent
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { use24HourFormat } = storeToRefs(calendarStore)

const { formatTimeRange, formatDate, getEventTypeColor, getEventTypeLabel } = useEventFormatting()

const eventTypeLabel = computed(() => getEventTypeLabel(props.event.type))
const eventTypeColor = computed(() => getEventTypeColor(props.event.type))

const formattedTimeRange = computed(() => formatTimeRange(props.event, use24HourFormat.value))

const formattedDate = computed(() => formatDate(props.event.startDate))
</script>

<template>
	<div class="space-y-4">
		<div class="flex items-start gap-3">
			<div class="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full" :class="eventTypeColor" />
			<div class="min-w-0 flex-1">
				<h3 class="text-base leading-tight font-semibold">
					{{ event.title }}
				</h3>
				<p class="text-muted-foreground mt-1 text-sm">
					{{ eventTypeLabel }}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:clock" class="text-muted-foreground h-4 w-4" />
			<span>{{ formattedTimeRange }}</span>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:calendar" class="text-muted-foreground h-4 w-4" />
			<span>{{ formattedDate }}</span>
		</div>

		<div v-if="event.location" class="flex items-center gap-3 text-sm">
			<Icon name="lucide:map-pin" class="text-muted-foreground h-4 w-4" />
			<span>{{ event.location }}</span>
		</div>

		<div v-if="event.teacher" class="flex items-center gap-3 text-sm">
			<Icon name="lucide:user" class="text-muted-foreground h-4 w-4" />
			<span>{{ event.teacher }}</span>
		</div>
	</div>
</template>

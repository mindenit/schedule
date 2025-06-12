<script setup lang="ts">
import { storeToRefs } from "pinia"

interface Props {
	event?: ICalendarEvent
	class?: string
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { use24HourFormat } = storeToRefs(calendarStore)

const { formatTimeRange, getEventTypeColor } = useEventFormatting()

const badgeClasses = computed(() => [
	"group flex w-full h-6.5 select-none items-center gap-1 rounded-md px-2 text-xs font-medium cursor-pointer transition-all duration-200 hover:shadow-sm",
	props.event ? getEventTypeColor(props.event.type) : "bg-muted text-muted-foreground w-full",
	props.class,
])

const formattedTime = computed(() => {
	if (!props.event) return ""
	return formatTimeRange(props.event, use24HourFormat.value)
})
</script>

<template>
	<div role="button" tabindex="0" :class="badgeClasses">
		<slot v-if="$slots.default" />
		<template v-else>
			<span class="flex-1 shrink-0 truncate">
				{{ event!.title }}
			</span>
			<span class="shrink-0 truncate group-[.hide-time]:hidden">{{ formattedTime }}</span>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { Schedule } from "nurekit"

interface Props {
	event: Schedule
	class?: string
}

const props = defineProps<Props>()

const { formatTimeRange, getEventTypeColor } = useEventFormatting()

const blockClasses = computed(() => [
	"flex flex-col gap-0.5 items-center justify-center select-none rounded-md px-2 text-xs focus-visible:outline-offset-2 transition-all duration-200 cursor-pointer overflow-hidden min-w-0 h-full",
	getEventTypeColor(props.event.type),
	props.class,
])

const formattedTimeRange = computed(() => formatTimeRange(props.event))
</script>

<template>
	<Popover>
		<PopoverTrigger as-child>
			<div role="button" tabindex="0" :class="blockClasses">
				<p class="w-full truncate text-center font-semibold">{{ event.subject.brief }}</p>
				<p class="w-full truncate text-center">
					{{ formattedTimeRange }}
				</p>
			</div>
		</PopoverTrigger>
		<PopoverContent class="w-80">
			<BigCalendarEventPopover :event />
		</PopoverContent>
	</Popover>
</template>

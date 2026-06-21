<script setup lang="ts">
import type { Schedule } from "nurekit"

interface Props {
	event: Schedule
	class?: string
}

const props = defineProps<Props>()

const { formatTimeRange, getEventTypeColor } = useEventFormatting()
const { trackEvent } = useAnalytics()

const blockClasses = computed(() => [
	"flex flex-col gap-0.5 items-center justify-center select-none rounded-md px-2 text-xs focus-visible:outline-offset-2 transition-all duration-200 cursor-pointer overflow-hidden min-w-0 h-full",
	getEventTypeColor(props.event.type),
	props.class,
])

const formattedTimeRange = computed(() => formatTimeRange(props.event))
</script>

<template>
	<UiPopover>
		<UiPopoverTrigger as-child>
			<div
				role="button"
				tabindex="0"
				:class="blockClasses"
				@click="trackEvent('event_opened', { lesson_type: event.type })"
				@keydown.enter.prevent="trackEvent('event_opened', { lesson_type: event.type })"
				@keydown.space.prevent="($event.currentTarget as HTMLElement).click()"
			>
				<p class="w-full truncate text-center font-semibold">{{ event.subject.brief }}</p>
				<p class="w-full truncate text-center">
					{{ formattedTimeRange }}
				</p>
			</div>
		</UiPopoverTrigger>
		<UiPopoverContent class="w-80">
			<BigCalendarEventPopover :event />
		</UiPopoverContent>
	</UiPopover>
</template>

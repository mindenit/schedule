<script setup lang="ts">
import type { Schedule } from "nurekit"

interface Props {
	event: Schedule
	class?: string
	/**
	 * When false (incoming panel during slide animation), interactive affordances
	 * are stripped: no UiPopover, no click/keydown handlers, no cursor-pointer,
	 * no transition. Markup and sizing stay pixel-identical to the live block.
	 * Defaults to true.
	 */
	interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), { interactive: true, class: undefined })

const { formatTimeRange, getEventTypeColor } = useEventFormatting()
const { trackEvent } = useAnalytics()

const blockClasses = computed(() => [
	props.interactive
		? "flex flex-col gap-0.5 items-center justify-center select-none rounded-md px-2 text-xs focus-visible:outline-offset-2 transition-colors duration-200 cursor-pointer overflow-hidden min-w-0 h-full"
		: "flex flex-col gap-0.5 items-center justify-center select-none rounded-md px-2 text-xs overflow-hidden min-w-0 h-full",
	getEventTypeColor(props.event.type),
	props.class,
])

const formattedTimeRange = computed(() => formatTimeRange(props.event))
</script>

<template>
	<!-- v-if="interactive": skip mounting UiPopover tree on the non-interactive incoming panel. -->
	<UiPopover v-if="interactive">
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

	<!-- Static (non-interactive) render — same markup, no Popover overhead. -->
	<div v-else :class="blockClasses">
		<p class="w-full truncate text-center font-semibold">{{ event.subject.brief }}</p>
		<p class="w-full truncate text-center">{{ formattedTimeRange }}</p>
	</div>
</template>

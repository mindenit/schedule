<script setup lang="ts">
import type { Schedule } from "nurekit"

interface Props {
	events: Schedule[]
	date: Date | string | number
}

const props = defineProps<Props>()

const { formatTime, formatDate, getEventTypeColor } = useEventFormatting()
const { trackEvent } = useAnalytics()

const formattedDate = computed(() => formatDate(props.date))

function getEventTimeRange(event: Schedule): string {
	return `${formatTime(event.startedAt)} - ${formatTime(event.endedAt)}`
}

// Inline detail expansion — replaces nested UiPopover per event.
// Clicking an event row shows its full detail inside this same panel,
// eliminating z-index stacking issues and nested popover a11y violations.
const expandedEvent = ref<Schedule | null>(null)

function selectEvent(event: Schedule) {
	expandedEvent.value = event
	trackEvent("event_opened", { lesson_type: event.type })
}

function collapseEvent() {
	expandedEvent.value = null
}
</script>

<template>
	<!-- Detail view for a selected event (back-navigable inline panel) -->
	<div v-if="expandedEvent" class="space-y-3">
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs
				transition-colors"
			@click="collapseEvent"
		>
			<AppIcon name="lucide:chevron-left" size="3.5" />
			Назад
		</button>
		<BigCalendarEventPopover :event="expandedEvent" />
	</div>

	<!-- Event list view -->
	<div v-else class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">
				{{ formattedDate }}
			</h3>
		</div>

		<div class="max-h-60 space-y-2 overflow-y-auto">
			<button
				v-for="event in events"
				:key="event.id"
				type="button"
				class="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 rounded-md
					p-2 text-left transition-colors"
				@click="selectEvent(event)"
			>
				<div
					class="h-3 w-3 flex-shrink-0 rounded-full"
					:class="getEventTypeColor(event.type)"
				/>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{{ event.subject.title }}</p>
					<p class="text-muted-foreground text-xs">
						{{ getEventTimeRange(event) }}
					</p>
				</div>
				<AppIcon
					name="lucide:chevron-right"
					size="3.5"
					class="text-muted-foreground shrink-0"
				/>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Schedule } from "nurekit"

interface Props {
	events: Schedule[]
	date: Date | string | number
}

const props = defineProps<Props>()

const { formatTime, formatDate, getEventTypeColor } = useEventFormatting()

const formattedDate = computed(() => formatDate(props.date))

function getEventTimeRange(event: Schedule): string {
	return `${formatTime(event.startedAt)} - ${formatTime(event.endedAt)}`
}
</script>

<template>
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">
				{{ formattedDate }}
			</h3>
		</div>

		<div class="max-h-60 space-y-2 overflow-y-auto">
			<Popover v-for="event in events" :key="event.id">
				<PopoverTrigger as-child>
					<div
						class="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors"
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
					</div>
				</PopoverTrigger>
				<PopoverContent class="w-80" side="left">
					<CalendarEventPopover :event="event" />
				</PopoverContent>
			</Popover>
		</div>
	</div>
</template>

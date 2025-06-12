<script setup lang="ts">
import { computed } from "vue"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { storeToRefs } from "pinia"
import type { ICalendarEvent, TEventType } from "../types"

interface Props {
	events: ICalendarEvent[]
	date: Date
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { use24HourFormat } = storeToRefs(calendarStore)

const typeColorMap: Record<TEventType, string> = {
	practise: "bg-event-practise",
	lecture: "bg-event-lecture",
	lab: "bg-event-lab",
	consultation: "bg-event-consultation",
	exam: "bg-event-exam",
	credit: "bg-event-credit",
}

const formattedDate = computed(() => {
	return format(props.date, "d MMMM yyyy", { locale: uk })
})
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
						<div class="h-3 w-3 flex-shrink-0 rounded-full" :class="typeColorMap[event.type]" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{{ event.title }}</p>
							<p class="text-muted-foreground text-xs">
								{{ formatTime(new Date(event.startDate), use24HourFormat) }} -
								{{ formatTime(new Date(event.endDate), use24HourFormat) }}
							</p>
						</div>
					</div>
				</PopoverTrigger>
				<PopoverContent class="w-80" side="left">
					<CalendarEventPopover :event="event" @edit="handleEdit" @delete="handleDelete" />
				</PopoverContent>
			</Popover>
		</div>
	</div>
</template>

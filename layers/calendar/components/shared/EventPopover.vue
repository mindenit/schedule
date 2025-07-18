<script setup lang="ts">
import type { Schedule } from "nurekit"

interface Props {
	event: Schedule
}

const props = defineProps<Props>()

const { formatTimeRange, formatDate, getEventTypeColor, getEventTypeLabel } = useEventFormatting()

const eventTypeLabel = computed(() => getEventTypeLabel(props.event.type))
const eventTypeColor = computed(() => getEventTypeColor(props.event.type))
const formattedTimeRange = computed(() => formatTimeRange(props.event))
const formattedDate = computed(() => formatDate(props.event.startedAt))

const teachersText = computed(() => {
	if (!props.event.teachers || props.event.teachers.length === 0) return "Не вказані"
	return props.event.teachers.map((teacher) => teacher.shortName).join(", ")
})

const groupsText = computed(() => {
	if (!props.event.groups || props.event.groups.length === 0) return "Не вказані"
	return props.event.groups.map((group) => group.name).join(", ")
})

const auditoriumText = computed(() => {
	return props.event.auditorium?.name || "Не вказана"
})

const pairNumber = computed(() => {
	return `${props.event.numberPair} пара`
})
</script>

<template>
	<div class="space-y-4">
		<div class="flex items-start gap-3">
			<div class="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full" :class="eventTypeColor" />
			<div class="min-w-0 flex-1">
				<h3 class="text-base leading-tight font-semibold">
					{{ `(${event.subject.brief}) ${event.subject.title}` }}
				</h3>
				<div class="mt-1 flex items-center gap-2">
					<p class="text-muted-foreground text-sm">
						{{ eventTypeLabel }}
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:clock" class="text-muted-foreground h-4 w-4 flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span>{{ formattedTimeRange }}</span>
				<span class="text-muted-foreground text-xs">{{ pairNumber }}</span>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:calendar" class="text-muted-foreground h-4 w-4 flex-shrink-0" />
			<span>{{ formattedDate }}</span>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:map-pin" class="text-muted-foreground h-4 w-4 flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span class="font-medium">{{ auditoriumText }}</span>
				<span class="text-muted-foreground text-xs">Аудиторія</span>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:user" class="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span>{{ teachersText }}</span>
				<span class="text-muted-foreground text-xs">
					{{ event.teachers.length === 1 ? "Викладач" : "Викладачі" }}
				</span>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:users" class="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span>{{ groupsText }}</span>
				<span class="text-muted-foreground text-xs">
					{{ event.groups.length === 1 ? "Група" : "Групи" }}
				</span>
			</div>
		</div>
	</div>
</template>

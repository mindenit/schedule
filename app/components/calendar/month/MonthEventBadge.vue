<script setup lang="ts">
import type { Schedule } from "nurekit"
import { getEventTimeRange } from "~/utils/event-cache"

interface Props {
	event?: Schedule
	class?: string
}

const props = defineProps<Props>()

const { getEventTypeColor } = useEventFormatting()
const { effectiveTimezone } = useTimezone()

// Static portion hoisted to module level — avoids allocating a new string on every render.
const BASE_CLASSES =
	"group flex w-full h-6.5 select-none items-center gap-1 rounded-md px-2 text-xs font-medium cursor-pointer transition-all duration-200 hover:shadow-sm"

const badgeClasses = computed(() => [
	BASE_CLASSES,
	props.event ? getEventTypeColor(props.event.type) : "bg-muted text-muted-foreground w-full",
	props.class,
])

// Time range is cached per Schedule object + timezone — no re-formatting on re-render.
const formattedTime = computed(() =>
	props.event ? getEventTimeRange(props.event, effectiveTimezone.value) : ""
)
</script>

<template>
	<div
		role="button"
		tabindex="0"
		:class="badgeClasses"
		@keydown.enter.prevent="($event.currentTarget as HTMLElement).click()"
		@keydown.space.prevent="($event.currentTarget as HTMLElement).click()"
	>
		<slot v-if="$slots.default" />
		<template v-else>
			<span class="flex-1 shrink-0 truncate">
				{{ event!.subject.brief }}
			</span>
			<span class="shrink-0 truncate group-[.hide-time]:hidden">{{ formattedTime }}</span>
		</template>
	</div>
</template>

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
	/**
	 * When true (day view), the block shows additional detail lines:
	 * time range, auditorium, and teacher(s). The column in day view is wide
	 * enough and tall enough to render these comfortably on all screen sizes.
	 * Defaults to false (compact mode for week/month views).
	 */
	detailed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	interactive: true,
	class: undefined,
	detailed: false,
})

const { formatTimeRange, getEventTypeColor } = useEventFormatting()
const { trackEvent } = useAnalytics()

const blockClasses = computed(() => [
	props.interactive
		? "flex flex-col gap-0.5 select-none rounded-md px-1 text-[11px] leading-tight focus-visible:outline-offset-2 transition-colors duration-200 cursor-pointer overflow-hidden min-w-0 h-full lg:px-2 lg:text-xs"
		: "flex flex-col gap-0.5 select-none rounded-md px-1 text-[11px] leading-tight overflow-hidden min-w-0 h-full lg:px-2 lg:text-xs",
	props.detailed ? "items-start justify-start pt-1.5" : "items-center justify-center",
	getEventTypeColor(props.event.type),
	props.class,
])

const formattedTimeRange = computed(() => formatTimeRange(props.event))

const auditoriumText = computed(() => props.event.auditorium?.name ?? null)

const teacherText = computed(() => {
	if (!props.event.teachers || props.event.teachers.length === 0) return null
	return props.event.teachers.map((t) => t.shortName).join(", ")
})
</script>

<template>
	<!-- v-if="interactive": skip mounting UiPopover tree on the non-interactive incoming panel. -->
	<UiPopover v-if="interactive">
		<UiPopoverTrigger as-child>
			<div
				role="button"
				tabindex="0"
				:aria-label="`${event.subject.title}, ${formattedTimeRange}`"
				:class="blockClasses"
				@click="trackEvent('event_opened', { lesson_type: event.type })"
				@keydown.enter.prevent="trackEvent('event_opened', { lesson_type: event.type })"
				@keydown.space.prevent="($event.currentTarget as HTMLElement).click()"
			>
				<!-- Compact mode (week/year views): brief + time on desktop -->
				<template v-if="!detailed">
					<p class="w-full truncate text-center font-semibold">
						{{ event.subject.brief }}
					</p>
					<p class="hidden w-full truncate text-center lg:block">
						{{ formattedTimeRange }}
					</p>
				</template>

				<!-- Detailed mode (day view): brief + time + auditorium + teacher -->
				<template v-else>
					<p class="w-full truncate font-semibold">{{ event.subject.brief }}</p>
					<p class="w-full truncate text-white/85">{{ formattedTimeRange }}</p>
					<p v-if="auditoriumText" class="mt-0.5 w-full truncate text-white/70">
						{{ auditoriumText }}
					</p>
					<p v-if="teacherText" class="w-full truncate text-white/70">
						{{ teacherText }}
					</p>
				</template>
			</div>
		</UiPopoverTrigger>
		<UiPopoverContent class="w-80">
			<BigCalendarEventPopover :event />
		</UiPopoverContent>
	</UiPopover>

	<!-- Static (non-interactive) render — same markup, no Popover overhead. -->
	<div v-else :class="blockClasses" aria-hidden="true">
		<template v-if="!detailed">
			<p class="w-full truncate text-center font-semibold">{{ event.subject.brief }}</p>
			<p class="hidden w-full truncate text-center lg:block">{{ formattedTimeRange }}</p>
		</template>
		<template v-else>
			<p class="w-full truncate font-semibold">{{ event.subject.brief }}</p>
			<p class="w-full truncate text-white/85">{{ formattedTimeRange }}</p>
			<p v-if="auditoriumText" class="mt-0.5 w-full truncate text-white/70">
				{{ auditoriumText }}
			</p>
			<p v-if="teacherText" class="w-full truncate text-white/70">{{ teacherText }}</p>
		</template>
	</div>
</template>

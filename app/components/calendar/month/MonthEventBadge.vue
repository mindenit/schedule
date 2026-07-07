<script setup lang="ts">
import type { Schedule } from "nurekit"
import { getEventTimeRange } from "~/utils/event-cache"

/* eslint-disable vue/require-default-prop -- optional props with no default are valid in TS defineProps; undefined IS the intended default */
interface Props {
	event?: Schedule
	class?: string
	/**
	 * Pre-baked color class from MonthView.buildPanel.
	 * When provided, the EVENT_TYPE_COLORS lookup and useEventFormatting() call
	 * are skipped entirely — this component becomes near-zero-cost to mount.
	 * Falls back to useEventFormatting() when absent (backward compat).
	 */
	colorClass?: string
	/**
	 * Pre-baked time range string from MonthView.buildPanel.
	 * Skips getEventTimeRange + useTimezone() when provided.
	 */
	timeRange?: string
	/**
	 * When false (incoming panel during slide animation), interactive affordances
	 * are stripped: no role=button, no tabindex, no keydown, no cursor-pointer,
	 * no hover shadow, no transition. Markup and sizing stay pixel-identical.
	 * Defaults to true (live panel, fully interactive).
	 */
	interactive?: boolean
}
/* eslint-enable vue/require-default-prop */

const props = withDefaults(defineProps<Props>(), { interactive: true })

// Only instantiate composables when pre-baked data is not provided.
// This is the backward-compat path (e.g. the "+N more" overflow badge has no event).
const _formatting = !props.colorClass ? useEventFormatting() : null
const _timezone = !props.timeRange && props.event ? useTimezone() : null

// Interactive base — includes cursor, hover shadow, transition.
const BASE_CLASSES =
	"group flex w-full h-6.5 select-none items-center gap-1 rounded-md px-2 text-xs font-medium cursor-pointer transition-shadow duration-200 hover:shadow-sm"

// Non-interactive base — same layout, no interactivity affordances.
// Used when :interactive=false (incoming panel during animation).
const BASE_CLASSES_STATIC =
	"group flex w-full h-6.5 select-none items-center gap-1 rounded-md px-2 text-xs font-medium"

const FALLBACK_COLOR = "bg-muted text-muted-foreground w-full"

const badgeClasses = computed(() => [
	props.interactive ? BASE_CLASSES : BASE_CLASSES_STATIC,
	props.colorClass ??
		(props.event ? _formatting!.getEventTypeColor(props.event.type) : FALLBACK_COLOR),
	props.class,
])

// Time range is cached per Schedule object + timezone — no re-formatting on re-render.
const formattedTime = computed(() => {
	if (props.timeRange !== undefined) return props.timeRange
	if (!props.event || !_timezone) return ""
	return getEventTimeRange(props.event, _timezone.effectiveTimezone.value)
})
</script>

<template>
	<div
		:role="interactive ? 'button' : undefined"
		:tabindex="interactive ? 0 : undefined"
		:aria-label="
			interactive && event
				? `${event.subject.title}${formattedTime ? ', ' + formattedTime : ''}`
				: undefined
		"
		:class="badgeClasses"
		@keydown.enter.prevent="interactive && ($event.currentTarget as HTMLElement).click()"
		@keydown.space.prevent="interactive && ($event.currentTarget as HTMLElement).click()"
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

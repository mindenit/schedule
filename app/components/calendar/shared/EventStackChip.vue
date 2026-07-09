<script setup lang="ts">
import type { Schedule } from "nurekit"

/**
 * EventStackChip — mobile-only chip for 2+ events overlapping in the same time slot.
 *
 * Renders as vertical color stripes (one per unique event type) with a centered
 * count pill on top. Tapping opens MoreEventsPopover showing all stacked events.
 *
 * Only rendered on mobile (< lg). Desktop uses full EventBlock rendering per event.
 * When interactive=false (incoming animation panel) renders a static placeholder.
 */

interface Props {
	events: Schedule[]
	day: Date
	interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), { interactive: true })

const { getEventTypeColor } = useEventFormatting()
const { trackEvent } = useAnalytics()

const count = computed(() => props.events.length)

/**
 * Unique event types in first-appearance order (events are pre-sorted by start time).
 * Drives the stripe segments — one stripe per distinct type.
 */
const uniqueTypes = computed(() => {
	const seen = new Set<string>()
	const result: string[] = []
	for (const e of props.events) {
		if (!seen.has(e.type)) {
			seen.add(e.type)
			result.push(e.type)
		}
	}
	return result
})

const ariaLabel = computed(() => {
	const typeGroups = uniqueTypes.value.map((t) => {
		const n = props.events.filter((e) => e.type === t).length
		return `${n} ${t}`
	})
	return `${count.value} занять: ${typeGroups.join(", ")}`
})
</script>

<template>
	<!-- Interactive: drawer slides up with event list (chip is mobile-only anyway) -->
	<UiDrawer v-if="interactive">
		<UiDrawerTrigger as-child>
			<div
				role="button"
				tabindex="0"
				:aria-label="ariaLabel"
				class="relative flex h-full w-full min-w-0 cursor-pointer overflow-hidden rounded-md
					transition-transform duration-100 select-none active:scale-[0.97]"
				@click="trackEvent('event_opened', { lesson_type: uniqueTypes.join('+') })"
				@keydown.enter.prevent="
					trackEvent('event_opened', { lesson_type: uniqueTypes.join('+') })
				"
				@keydown.space.prevent="($event.currentTarget as HTMLElement).click()"
			>
				<!-- Stripe segments — one per distinct event type -->
				<span
					v-for="type in uniqueTypes"
					:key="type"
					class="flex-1"
					:class="getEventTypeColor(type)"
				/>

				<!-- Centered count pill -->
				<span class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
					<span
						class="rounded-sm bg-black/30 px-1 py-0.5 text-[0.625rem] leading-none
							font-semibold text-white"
					>
						{{ count }}
					</span>
				</span>
			</div>
		</UiDrawerTrigger>
		<UiDrawerContent>
			<UiDrawerTitle class="sr-only">{{ count }} занять</UiDrawerTitle>
			<UiDrawerDescription class="sr-only"
				>Список занять у цьому часовому слоті</UiDrawerDescription
			>
			<div class="mx-auto w-full max-w-md overflow-y-auto px-4 pt-2 pb-8">
				<BigCalendarMoreEventsPopover :events="events" :date="day" />
			</div>
		</UiDrawerContent>
	</UiDrawer>

	<!-- Static (non-interactive) render during animation — no Popover overhead -->
	<div
		v-else
		aria-hidden="true"
		class="relative flex h-full w-full min-w-0 overflow-hidden rounded-md"
	>
		<span
			v-for="type in uniqueTypes"
			:key="type"
			class="flex-1"
			:class="getEventTypeColor(type)"
		/>
		<span class="absolute inset-0 flex items-center justify-center">
			<span
				class="rounded-sm bg-black/30 px-1 py-0.5 text-[0.625rem] leading-none font-semibold
					text-white"
			>
				{{ count }}
			</span>
		</span>
	</div>
</template>

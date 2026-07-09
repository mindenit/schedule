<script setup lang="ts">
import type { Schedule } from "nurekit"
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion-v"

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

// Track direction for slide animation: 1 = going to detail (→ left), -1 = going back (→ right)
const direction = ref(1)

function selectEvent(event: Schedule) {
	direction.value = 1
	expandedEvent.value = event
	trackEvent("event_opened", { lesson_type: event.type })
}

function collapseEvent() {
	direction.value = -1
	expandedEvent.value = null
}

const variants = computed(() => ({
	initial: { opacity: 0, x: direction.value * 24 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: direction.value * -24 },
}))

// -------------------------------------------------------------------
// Height animation: ResizeObserver on the inner content div feeds
// a spring-animated height on the outer wrapper. This drives the
// drawer's own height change as the user switches list ↔ detail.
// -------------------------------------------------------------------
const contentRef = useTemplateRef<HTMLElement>("content")
const heightMv = useMotionValue(0)
const springHeight = useSpring(heightMv, { stiffness: 280, damping: 28 })

let ro: ResizeObserver | undefined

onMounted(() => {
	if (!contentRef.value) return
	// Seed with real initial height — avoids animating from 0 on first open.
	heightMv.jump(contentRef.value.offsetHeight)
	ro = new ResizeObserver(([entry]) => {
		if (entry) heightMv.set(entry.contentRect.height)
	})
	ro.observe(contentRef.value)
})

onBeforeUnmount(() => {
	ro?.disconnect()
})
</script>

<template>
	<!--
		Outer wrapper: spring-animated height so the drawer shell resizes smoothly
		when content switches from list to detail (different heights).
		overflow-hidden clips the crossfading inner views during transition.
	-->
	<motion.div :style="{ height: springHeight }" class="overflow-hidden">
		<!--
			Inner content div: measured by ResizeObserver.
			Must not be animated itself (position:absolute would break measurement).
		-->
		<div ref="content">
			<AnimatePresence mode="wait">
				<!-- Detail view for a selected event (back-navigable inline panel) -->
				<motion.div
					v-if="expandedEvent"
					:key="expandedEvent.id"
					:initial="variants.initial"
					:animate="variants.animate"
					:exit="variants.exit"
					:transition="{ type: 'tween', duration: 0.18, ease: 'easeInOut' }"
					class="space-y-3"
				>
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground flex items-center gap-1
							text-xs transition-colors"
						@click="collapseEvent"
					>
						<AppIcon name="lucide:chevron-left" size="3.5" />
						Назад
					</button>
					<BigCalendarEventPopover :event="expandedEvent" />
				</motion.div>

				<!-- Event list view -->
				<motion.div
					v-else
					key="list"
					:initial="variants.initial"
					:animate="variants.animate"
					:exit="variants.exit"
					:transition="{ type: 'tween', duration: 0.18, ease: 'easeInOut' }"
					class="space-y-3"
				>
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
							class="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3
								rounded-md p-2 text-left transition-colors"
							@click="selectEvent(event)"
						>
							<div
								class="h-3 w-3 shrink-0 rounded-full"
								:class="getEventTypeColor(event.type)"
							/>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">
									{{ event.subject.title }}
								</p>
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
				</motion.div>
			</AnimatePresence>
		</div>
	</motion.div>
</template>

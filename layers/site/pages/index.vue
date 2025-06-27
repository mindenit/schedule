<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import { groupScheduleOptions } from "~/core/queries/groups"

const calendarStore = useCalendarStore()
const { filteredEvents, selectedDate, view } = storeToRefs(calendarStore)

async function loadEvents() {
	try {
		console.log("🔄 Loading events for:", {
			selectedDate: selectedDate.value,
			view: view.value,
		})
		const { start, end } = getCalendarGridRange(selectedDate.value, view.value)
		const startTimestamp = Math.floor(start.getTime() / 1000)
		const endTimestamp = Math.floor(end.getTime() / 1000)

		const { data, suspense } = useQuery(groupScheduleOptions(startTimestamp, endTimestamp))
		await suspense()

		if (data.value) {
			calendarStore.setEvents(data.value)
		}
	} catch (error) {
		console.error("❌ Failed to fetch events:", error)
	}
}

onMounted(async () => {
	await loadEvents()
})

watch(
	[selectedDate, view],
	async () => {
		await loadEvents()
	},
	{ deep: true }
)
</script>

<template>
	<div class="min-h-screen p-6">
		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<CalendarDateNavigator />
			<CalendarViewSwitcher />
		</div>
		<CalendarRoot :events="filteredEvents" />
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"

const calendarStore = useCalendarStore()
const { filteredEvents, view } = storeToRefs(calendarStore)

const mockEvents: ICalendarEvent[] = [
	{
		id: 1,
		title: "Вища математика",
		type: "lecture",
		startDate: "2025-06-09T08:30:00",
		endDate: "2025-06-09T10:00:00",
	},
	{
		id: 2,
		title: "Програмування",
		type: "lecture",
		startDate: "2025-06-10T10:15:00",
		endDate: "2025-06-10T11:45:00",
	},
	{
		id: 3,
		title: "Фізика",
		type: "lecture",
		startDate: "2025-06-11T12:00:00",
		endDate: "2025-06-11T13:30:00",
	},

	{
		id: 4,
		title: "Практика з програмування",
		type: "practise",
		startDate: "2025-06-09T14:00:00",
		endDate: "2025-06-09T15:30:00",
	},
	{
		id: 5,
		title: "Практика з математики",
		type: "practise",
		startDate: "2025-06-12T08:30:00",
		endDate: "2025-06-12T10:00:00",
	},

	{
		id: 6,
		title: "Лабораторна робота №3",
		type: "lab",
		startDate: "2025-06-10T14:00:00",
		endDate: "2025-06-10T17:00:00",
	},
	{
		id: 7,
		title: "Лабораторна з фізики",
		type: "lab",
		startDate: "2025-06-13T10:15:00",
		endDate: "2025-06-13T13:15:00",
	},

	{
		id: 8,
		title: "Консультація перед екзаменом",
		type: "consultation",
		startDate: "2025-06-16T15:00:00",
		endDate: "2025-06-16T16:30:00",
	},
	{
		id: 9,
		title: "Консультація з проектом",
		type: "consultation",
		startDate: "2025-06-14T11:00:00",
		endDate: "2025-06-14T12:00:00",
	},

	{
		id: 10,
		title: "Екзамен з вищої математики",
		type: "exam",
		startDate: "2025-06-18T09:00:00",
		endDate: "2025-06-18T12:00:00",
	},
	{
		id: 11,
		title: "Залік з програмування",
		type: "credit",
		startDate: "2025-06-19T14:00:00",
		endDate: "2025-06-19T16:00:00",
	},

	{
		id: 15,
		title: "Семінар з ІТ",
		type: "lecture",
		startDate: "2025-06-05T16:00:00",
		endDate: "2025-06-05T17:30:00",
	},
	{
		id: 16,
		title: "Захист курсових робіт",
		type: "exam",
		startDate: "2025-06-20T10:00:00",
		endDate: "2025-06-20T18:00:00",
	},
]

const allEvents = computed(() => filteredEvents.value)

onMounted(() => {
	calendarStore.setEvents(mockEvents)
})
</script>

<template>
	<div class="bg-background min-h-screen p-6">
		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<CalendarDateNavigator />
				<CalendarViewSwitcher />
			</div>
		</div>

		<div class="rounded-lg p-6">
			<CalendarMonthView v-if="view === 'month'" :events="allEvents" />
			<CalendarWeekView v-else-if="view === 'week'" :events="allEvents" />
			<CalendarDayView v-else-if="view === 'day'" :events="allEvents" />
			<div v-else class="text-muted-foreground flex h-96 items-center justify-center">
				<p>{{ view }} view ще не реалізований</p>
			</div>
		</div>
	</div>
</template>

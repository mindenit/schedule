<script setup lang="ts">
import { storeToRefs } from "pinia"

const calendarStore = useCalendarStore()
const { filteredEvents, view } = storeToRefs(calendarStore)

interface ICalendarEvent {
	id: number
	title: string
	type: "lecture" | "practise" | "lab" | "consultation" | "exam" | "credit"
	startDate: string
	endDate: string
}

function generateYearlyMockEvents(year: number = 2025): ICalendarEvent[] {
	const events: ICalendarEvent[] = []
	let eventId = 1

	const subjects = [
		{ name: "Вища математика", types: ["lecture", "practise", "exam"] },
		{ name: "Програмування", types: ["lecture", "practise", "lab", "credit"] },
		{ name: "Фізика", types: ["lecture", "lab", "exam"] },
		{ name: "Алгебра", types: ["lecture", "practise", "credit"] },
		{ name: "Дискретна математика", types: ["lecture", "practise", "exam"] },
		{ name: "Бази даних", types: ["lecture", "lab", "credit"] },
		{ name: "Операційні системи", types: ["lecture", "practise", "exam"] },
		{ name: "Комп'ютерна графіка", types: ["lecture", "lab", "credit"] },
		{ name: "Веб-технології", types: ["lecture", "lab", "practise", "credit"] },
		{ name: "Англійська мова", types: ["lecture", "practise", "credit"] },
	]

	const additionalEvents = [
		{ title: "Консультація перед екзаменом", type: "consultation" },
		{ title: "Консультація з проектом", type: "consultation" },
		{ title: "Консультація з курсовою", type: "consultation" },
		{ title: "Захист курсових робіт", type: "exam" },
		{ title: "Захист дипломних робіт", type: "exam" },
		{ title: "Семінар з ІТ", type: "lecture" },
		{ title: "Науковий семінар", type: "lecture" },
		{ title: "Майстер-клас", type: "lecture" },
	]

	const timeSlots = [
		{ start: "08:30", end: "10:00" },
		{ start: "10:15", end: "11:45" },
		{ start: "12:00", end: "13:30" },
		{ start: "14:00", end: "15:30" },
		{ start: "15:45", end: "17:15" },
		{ start: "17:30", end: "19:00" },
	]

	const extendedTimeSlots = [
		{ start: "09:00", end: "12:00" },
		{ start: "14:00", end: "17:00" },
		{ start: "10:00", end: "18:00" },
	]

	function getRandomDate(startMonth: number, endMonth: number): Date {
		const startDate = new Date(year, startMonth - 1, 1)
		const endDate = new Date(year, endMonth, 0)

		let randomDate: Date
		do {
			const randomTime =
				startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
			randomDate = new Date(randomTime)
		} while (randomDate.getDay() === 0 || randomDate.getDay() === 6)

		return randomDate
	}

	function formatDateTime(date: Date, timeString: string): string {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, "0")
		const day = String(date.getDate()).padStart(2, "0")
		return `${year}-${month}-${day}T${timeString}:00`
	}

	const semesters = [{ start: 5, end: 7 }]

	semesters.forEach((semester) => {
		subjects.forEach((subject) => {
			subject.types.forEach((type) => {
				const eventsCount =
					type === "lecture"
						? 12
						: type === "practise"
							? 8
							: type === "lab"
								? 6
								: type === "exam" || type === "credit"
									? 1
									: 4

				for (let i = 0; i < eventsCount; i++) {
					const eventDate = getRandomDate(semester.start, semester.end)
					let timeSlot, title

					if (type === "exam" || type === "credit") {
						timeSlot = extendedTimeSlots[Math.floor(Math.random() * extendedTimeSlots.length)]
						title =
							type === "exam"
								? `Екзамен з ${subject.name.toLowerCase()}`
								: `Залік з ${subject.name.toLowerCase()}`
					} else if (type === "lab") {
						timeSlot =
							Math.random() > 0.5
								? extendedTimeSlots[1]
								: timeSlots[Math.floor(Math.random() * timeSlots.length)]
						title = `Лабораторна робота №${i + 1} (${subject.name})`
					} else if (type === "practise") {
						timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
						title = `Практика з ${subject.name.toLowerCase()}`
					} else {
						timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
						title = subject.name
					}

					events.push({
						id: eventId++,
						title,
						type: type as ICalendarEvent["type"],
						startDate: formatDateTime(eventDate, timeSlot?.start ?? "08:30"),
						endDate: formatDateTime(eventDate, timeSlot?.end ?? "10:00"),
					})
				}
			})
		})
	})

	for (let i = 0; i < 15; i++) {
		const event = additionalEvents[Math.floor(Math.random() * additionalEvents.length)]
		const semester = semesters[Math.floor(Math.random() * semesters.length)]
		const eventDate = getRandomDate(semester!.start, semester!.end)

		let timeSlot
		if (event && event.type === "exam") {
			timeSlot = extendedTimeSlots[Math.floor(Math.random() * extendedTimeSlots.length)]
		} else if (event && event.type === "consultation") {
			timeSlot = { start: "15:00", end: "16:30" }
		} else {
			timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
		}

		// Provide fallback if timeSlot is undefined
		const safeTimeSlot = timeSlot ?? { start: "08:30", end: "10:00" }

		if (event) {
			events.push({
				id: eventId++,
				title: event.title,
				type: event.type as ICalendarEvent["type"],
				startDate: formatDateTime(eventDate, safeTimeSlot.start),
				endDate: formatDateTime(eventDate, safeTimeSlot.end),
			})
		}
	}

	return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

const yearlyEvents = generateYearlyMockEvents(2025)

const mockEvents = yearlyEvents

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
			<div class="text-muted-foreground flex items-center gap-2 text-sm">
				<span>Подій завантажено: {{ mockEvents.length }}</span>
			</div>
		</div>
		<div class="rounded-lg p-6">
			<CalendarMonthView v-if="view === 'month'" :events="allEvents" />
			<CalendarWeekView v-else-if="view === 'week'" :events="allEvents" />
			<CalendarDayView v-else-if="view === 'day'" :events="allEvents" />
		</div>
	</div>
</template>

import type { Auditorium, Group, Subject, Teacher } from "nurekit"

export function generateYearlyMockSchedule(year: number = 2025): ICalendarEvent[] {
	const events: ICalendarEvent[] = []
	let eventId = 1

	const mockGroups: Group[] = [
		{ id: 1, name: "ІТ-21" },
		{ id: 2, name: "ІТ-22" },
		{ id: 3, name: "КН-21" },
		{ id: 4, name: "КН-22" },
		{ id: 5, name: "ПІ-21" },
	]

	const mockAuditoriums: Auditorium[] = [
		{ id: 1, name: "201" },
		{ id: 2, name: "202" },
		{ id: 3, name: "301" },
		{ id: 4, name: "302" },
		{ id: 5, name: "Лаб-1" },
		{ id: 6, name: "Лаб-2" },
		{ id: 7, name: "Актовый зал" },
	]

	const mockTeachers: Teacher[] = [
		{ id: 1, fullName: "Иванов Иван Иванович", shortName: "Иванов И.И." },
		{ id: 2, fullName: "Петрова Мария Сергеевна", shortName: "Петрова М.С." },
		{ id: 3, fullName: "Сидоров Александр Николаевич", shortName: "Сидоров А.Н." },
		{ id: 4, fullName: "Козлова Елена Викторовна", shortName: "Козлова Е.В." },
		{ id: 5, fullName: "Морозов Дмитрий Александрович", shortName: "Морозов Д.А." },
	]

	const mockSubjects: Subject[] = [
		{ id: 1, brief: "ВМ", title: "Вища математика" },
		{ id: 2, brief: "ПРОГ", title: "Програмування" },
		{ id: 3, brief: "ФІЗ", title: "Фізика" },
		{ id: 4, brief: "АЛГ", title: "Алгебра" },
		{ id: 5, brief: "ДМ", title: "Дискретна математика" },
		{ id: 6, brief: "БД", title: "Бази даних" },
		{ id: 7, brief: "ОС", title: "Операційні системи" },
		{ id: 8, brief: "КГ", title: "Комп'ютерна графіка" },
		{ id: 9, brief: "ВТ", title: "Веб-технології" },
		{ id: 10, brief: "АНГ", title: "Англійська мова" },
	]

	const subjectsWithTypes = [
		{ subject: mockSubjects[0], types: ["lecture", "practise", "exam"] as TEventType[] },
		{ subject: mockSubjects[1], types: ["lecture", "practise", "lab", "credit"] as TEventType[] },
		{ subject: mockSubjects[2], types: ["lecture", "lab", "exam"] as TEventType[] },
		{ subject: mockSubjects[3], types: ["lecture", "practise", "credit"] as TEventType[] },
		{ subject: mockSubjects[4], types: ["lecture", "practise", "exam"] as TEventType[] },
		{ subject: mockSubjects[5], types: ["lecture", "lab", "credit"] as TEventType[] },
		{ subject: mockSubjects[6], types: ["lecture", "practise", "exam"] as TEventType[] },
		{ subject: mockSubjects[7], types: ["lecture", "lab", "credit"] as TEventType[] },
		{ subject: mockSubjects[8], types: ["lecture", "lab", "practise", "credit"] as TEventType[] },
		{ subject: mockSubjects[9], types: ["lecture", "practise", "credit"] as TEventType[] },
	]

	const timeSlots = [
		{ numberPair: 1, start: "08:30", end: "10:00" },
		{ numberPair: 2, start: "10:15", end: "11:45" },
		{ numberPair: 3, start: "12:00", end: "13:30" },
		{ numberPair: 4, start: "14:00", end: "15:30" },
		{ numberPair: 5, start: "15:45", end: "17:15" },
		{ numberPair: 6, start: "17:30", end: "19:00" },
	]

	const extendedTimeSlots = [
		{ numberPair: 1, start: "09:00", end: "12:00" },
		{ numberPair: 3, start: "14:00", end: "17:00" },
		{ numberPair: 2, start: "10:00", end: "18:00" },
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

	function dateTimeToTimestamp(date: Date, timeString: string): number {
		const [hours, minutes] = timeString.split(":").map(Number)
		const dateTime = new Date(date)
		dateTime.setHours(hours!, minutes, 0, 0)
		return dateTime.getTime()
	}

	function getRandomElement<T>(array: T[]): T {
		return array[Math.floor(Math.random() * array.length)]!
	}

	function getRandomElements<T>(array: T[], count: number = 1): T[] {
		const shuffled = [...array].sort(() => 0.5 - Math.random())
		return shuffled.slice(0, Math.min(count, array.length))
	}

	const semesters = [{ start: 5, end: 7 }]

	for (const semester of semesters) {
		for (const { subject, types } of subjectsWithTypes) {
			for (const type of types) {
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
					let timeSlot

					if (type === "exam" || type === "credit") {
						timeSlot = getRandomElement(extendedTimeSlots)
					} else if (type === "lab") {
						timeSlot = Math.random() > 0.5 ? extendedTimeSlots[1] : getRandomElement(timeSlots)
					} else {
						timeSlot = getRandomElement(timeSlots)
					}

					const auditorium =
						type === "lab"
							? getRandomElement(mockAuditoriums.filter((a) => a.name.includes("Лаб")))
							: type === "exam"
								? mockAuditoriums.find((a) => a.name === "Актовый зал") ||
									getRandomElement(mockAuditoriums)
								: getRandomElement(mockAuditoriums.filter((a) => !a.name.includes("Лаб")))

					events.push({
						id: eventId++,
						startedAt: dateTimeToTimestamp(eventDate, timeSlot!.start),
						endedAt: dateTimeToTimestamp(eventDate, timeSlot!.end),
						auditorium,
						numberPair: timeSlot!.numberPair,
						type,
						groups: getRandomElements(mockGroups, Math.floor(Math.random() * 3) + 1),
						teachers: getRandomElements(mockTeachers, Math.floor(Math.random() * 2) + 1),
						subject: subject!,
					})
				}
			}
		}
	}

	return events.sort((a, b) => a.startedAt - b.startedAt)
}

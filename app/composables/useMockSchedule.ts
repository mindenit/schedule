/**
 * DEV-ONLY mock schedule data — fills an entire calendar year with realistic events.
 * Remove the import in index.vue (or set USE_MOCK = false) to disable.
 */
import type { Schedule } from "nurekit"

const SUBJECTS = [
	"Вища математика",
	"Фізика",
	"Програмування",
	"Алгоритми та структури даних",
	"Бази даних",
	"Операційні системи",
	"Комп'ютерні мережі",
	"Дискретна математика",
	"Теорія ймовірностей",
	"Чисельні методи",
]

const TYPES = ["Лк", "Лб", "Пз", "Зал", "Екз", "Конс"]

// Pair slots: [startHour, startMin, endHour, endMin]
const PAIR_SLOTS: [number, number, number, number][] = [
	[8, 0, 9, 35],
	[9, 45, 11, 20],
	[11, 30, 13, 5],
	[13, 15, 14, 50],
	[15, 0, 16, 35],
	[16, 45, 18, 20],
]

function seededRandom(seed: number): () => number {
	let s = seed
	return () => {
		s = (s * 16807 + 0) % 2147483647
		return (s - 1) / 2147483646
	}
}

export function useMockSchedule(): Schedule[] {
	const year = new Date().getFullYear()
	const events: Schedule[] = []
	const rand = seededRandom(42)

	let id = 1

	for (let month = 0; month < 12; month++) {
		const daysInMonth = new Date(year, month + 1, 0).getDate()

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day)
			const dow = date.getDay() // 0 = Sun

			// Skip weekends ~70% of the time, skip some weekdays too
			if (dow === 0) continue
			if (dow === 6 && rand() > 0.15) continue
			if (rand() > 0.75) continue // ~25% of weekdays have no classes

			// Pick 3–6 pairs for this day (denser schedule)
			const pairCount = Math.floor(rand() * 4) + 3
			const usedSlots = new Set<number>()

			// Bias a dominant type for this day (like real timetables — a day is mostly lectures or labs)
			const dominantType = TYPES[Math.floor(rand() * TYPES.length)]

			for (let p = 0; p < pairCount; p++) {
				let slotIdx: number
				let attempts = 0
				do {
					slotIdx = Math.floor(rand() * PAIR_SLOTS.length)
					attempts++
				} while (usedSlots.has(slotIdx) && attempts < 10)

				if (usedSlots.has(slotIdx)) continue
				usedSlots.add(slotIdx)

				const [sh, sm, eh, em] = PAIR_SLOTS[slotIdx]
				const startedAt = Math.floor(
					new Date(year, month, day, sh, sm, 0).getTime() / 1000
				)
				const endedAt = Math.floor(
					new Date(year, month, day, eh, em, 0).getTime() / 1000
				)

				const subjectName = SUBJECTS[Math.floor(rand() * SUBJECTS.length)]
				// 70% chance to use the dominant type for this day
				const type = rand() < 0.7 ? dominantType : TYPES[Math.floor(rand() * TYPES.length)]

				events.push({
					id: id++,
					startedAt,
					endedAt,
					numberPair: slotIdx + 1,
					pairIndex: p + 1,
					pairsCount: pairCount,
					type,
					auditorium: { id: 1, name: `А-${Math.floor(rand() * 20) + 101}` },
					groups: [{ id: 1, name: "КН-21" }],
					teachers: [{ id: 1, fullName: "Іванов І.І.", shortName: "Іванов І.І." }],
					subject: {
						id: Math.floor(rand() * SUBJECTS.length) + 1,
						title: subjectName,
						brief: subjectName.split(" ").map((w) => w[0]).join("").toUpperCase(),
					},
				} as Schedule)
			}
		}
	}

	return events
}

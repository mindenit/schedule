import { endOfMonth, startOfMonth, addDays, startOfWeek, format } from "date-fns"
import { uk } from "date-fns/locale"

export const useCalendarCells = () => {
	const getCalendarCells = (selectedDate: Date): ICalendarCell[] => {
		const year = selectedDate.getFullYear()
		const month = selectedDate.getMonth()

		const daysInMonth = endOfMonth(selectedDate).getDate()
		const firstDayOfMonth = startOfMonth(selectedDate)

		const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7
		const daysInPrevMonth = endOfMonth(new Date(year, month - 1)).getDate()

		const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
			const day = daysInPrevMonth - firstDayOfWeek + i + 1
			return {
				day,
				currentMonth: false,
				date: new Date(year, month - 1, day),
			}
		})

		const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
			day: i + 1,
			currentMonth: true,
			date: new Date(year, month, i + 1),
		}))

		const totalDays = firstDayOfWeek + daysInMonth
		const nextMonthDays = Array.from({ length: (7 - (totalDays % 7)) % 7 }, (_, i) => ({
			day: i + 1,
			currentMonth: false,
			date: new Date(year, month + 1, i + 1),
		}))

		return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
	}

	const getWeekDays = (selectedDate: Date) => {
		const weekStart = startOfWeek(selectedDate, WEEK_OPTIONS)
		return Array.from({ length: 7 }, (_, i) => {
			const day = addDays(weekStart, i)
			const dayName = format(day, "E", { locale: uk })
			return dayName.charAt(0).toUpperCase() + dayName.slice(1)
		})
	}

	const getWeekDaysDetailed = (selectedDate: Date) => {
		const weekStart = startOfWeek(selectedDate, WEEK_OPTIONS)
		return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
	}

	return {
		getCalendarCells,
		getWeekDays,
		getWeekDaysDetailed,
	}
}

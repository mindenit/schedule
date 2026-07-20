import type { Schedule } from "@mindenit/nurekit"
import { useIcsExport } from "./useIcsExport"
import { ref, readonly } from "vue"
import { useQueryClient } from "@tanstack/vue-query"
import { groupScheduleOptions } from "~/queries/groups"
import { teacherScheduleOptions } from "~/queries/teachers"
import { auditoriumScheduleOptions } from "~/queries/auditoriums"

const scheduleOptionsByType = {
	group: groupScheduleOptions,
	teacher: teacherScheduleOptions,
	auditorium: auditoriumScheduleOptions,
} as const

export const useScheduleIcsExport = () => {
	const { exportScheduleToIcs, getAcademicYearTimestamps } = useIcsExport()
	const queryClient = useQueryClient()

	const isLoading = ref(false)

	const exportAcademicYearSchedule = async (
		scheduleId: number,
		scheduleType: "group" | "teacher" | "auditorium",
		options?: {
			includedEventTypes?: string[]
			customFilename?: string
		}
	) => {
		const loadingToastId = "ics-loading"
		try {
			isLoading.value = true

			const { startTimestamp, endTimestamp } = getAcademicYearTimestamps()

			useSonner.loading("Завантаження розкладу", {
				id: loadingToastId,
				description: "Отримання даних за навчальний рік...",
			})

			const buildOptions = scheduleOptionsByType[scheduleType]
			if (!buildOptions) {
				useSonner.error("Помилка експорту", {
					id: loadingToastId,
					description: "Невідомий тип розкладу",
				})
				return
			}

			const events: Schedule[] = await queryClient.fetchQuery(
				buildOptions(scheduleId, startTimestamp, endTimestamp)
			)

			if (!events || events.length === 0) {
				useSonner.warning("Немає даних", {
					id: loadingToastId,
					description: "Розклад на цей навчальний рік не знайдено",
				})
				return
			}

			const academicYear = new Date(startTimestamp * 1000)
			const filename =
				options?.customFilename ||
				`schedule-${scheduleType}-${scheduleId}-${academicYear.getFullYear()}-${academicYear.getFullYear() + 1}.ics`

			exportScheduleToIcs(events, filename, {
				academicYearStart: academicYear,
				includedEventTypes: options?.includedEventTypes,
				includeDescription: true,
			})

			useSonner.success("Експорт завершено", {
				id: loadingToastId,
				description: `Завантажено ${events.length} подій у форматі ICS`,
			})
		} catch {
			useSonner.error("Помилка експорту", {
				id: loadingToastId,
				description: "Не вдалося експортувати розклад",
			})
		} finally {
			isLoading.value = false
		}
	}

	const exportCurrentSchedule = async (
		currentEvents: Schedule[],
		options?: {
			includedEventTypes?: string[]
			customFilename?: string
		}
	) => {
		try {
			if (!currentEvents || currentEvents.length === 0) {
				useSonner.warning("Немає даних", {
					description: "Немає подій для експорту",
				})
				return
			}

			const academicYear = new Date()
			const filename =
				options?.customFilename ||
				`current-schedule-${academicYear.getFullYear()}-${academicYear.getFullYear() + 1}.ics`

			exportScheduleToIcs(currentEvents, filename, {
				academicYearStart: academicYear,
				includedEventTypes: options?.includedEventTypes,
				includeDescription: true,
			})

			useSonner.success("Експорт завершено", {
				description: `Завантажено ${currentEvents.length} подій у форматі ICS`,
			})
		} catch {
			useSonner.error("Помилка експорту", {
				description: "Не вдалося експортувати поточний розклад",
			})
		}
	}

	return {
		exportAcademicYearSchedule,
		exportCurrentSchedule,
		isLoading: readonly(isLoading),
	}
}

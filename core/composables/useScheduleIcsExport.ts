import type { Schedule } from "nurekit"
import { toast } from "vue-sonner"
import { useIcsExport } from "./useIcsExport"
import { ref, readonly } from "vue"
import { useQueryClient } from "@tanstack/vue-query"
import { groupScheduleOptions } from "~/core/queries/groups"
import { teacherScheduleOptions } from "~/core/queries/teachers"
import { auditoriumScheduleOptions } from "~/core/queries/auditoriums"

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
		try {
			isLoading.value = true

			const { startTimestamp, endTimestamp } = getAcademicYearTimestamps()

			toast.info("Завантаження розкладу", {
				description: "Отримання даних за навчальний рік...",
			})

			let queryOptions
			switch (scheduleType) {
				case "group":
					queryOptions = groupScheduleOptions(
						ref(scheduleId),
						ref(startTimestamp),
						ref(endTimestamp)
					)
					break
				case "teacher":
					queryOptions = teacherScheduleOptions(
						ref(scheduleId),
						ref(startTimestamp),
						ref(endTimestamp)
					)
					break
				case "auditorium":
					queryOptions = auditoriumScheduleOptions(
						ref(scheduleId),
						ref(startTimestamp),
						ref(endTimestamp)
					)
					break
				default:
					toast.error("Помилка експорту", { description: "Невідомий тип розкладу" })
					return
			}

			const events: Schedule[] = await queryClient.fetchQuery(queryOptions)

			if (!events || events.length === 0) {
				toast.warning("Немає даних", {
					description: "Розкладання за цей навчальний рік не знайдено",
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

			toast.success("Експорт завершено", {
				description: `Завантажено ${events.length} подій у форматі ICS`,
			})
		} catch (error) {
			console.error("Error exporting schedule:", error)
			toast.error("Помилка експорту", {
				description: "Не вдалося експортувати розкладання",
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
				toast.warning("Немає даних", {
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

			toast.success("Експорт завершено", {
				description: `Завантажено ${currentEvents.length} подій у форматі ICS`,
			})
		} catch (error) {
			console.error("Error exporting current schedule:", error)
			toast.error("Помилка експорту", {
				description: "Не вдалося експортувати поточне розкладання",
			})
		}
	}

	return {
		exportAcademicYearSchedule,
		exportCurrentSchedule,
		isLoading: readonly(isLoading),
	}
}

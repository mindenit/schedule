import { ref } from "vue"
import { toast } from "vue-sonner"
import type { Link } from "nurekit"

export interface SharableLink {
	id: string
	links: Link[]
}

export const useSharableLinks = () => {
	const { $nurekit } = useNuxtApp()
	const isLoading = ref(false)

	/**
	 * Инициализировать UUID для schedule-client-id куки
	 */
	const initializeClientId = () => {
		if (import.meta.client) {
			const cookieName = "schedule-client-id"
			let clientId = useCookie(cookieName).value

			if (!clientId) {
				clientId = crypto.randomUUID()
				const cookie = useCookie(cookieName, {
					maxAge: 60 * 60 * 24 * 365, // 1 год
				})
				cookie.value = clientId
				console.log("Created new schedule-client-id:", clientId)
			} else {
				console.log("Using existing schedule-client-id:", clientId)
			}

			return clientId
		}
	}

	// Инициализировать при первой загрузке
	if (import.meta.client) {
		initializeClientId()
	}

	const createSharableLink = async (linkIds: string[]): Promise<string | null> => {
		if (linkIds.length === 0) {
			toast.error("Помилка", {
				description: "Виберіть принаймні одне посилання",
			})
			return null
		}

		try {
			isLoading.value = true

			const result = await $nurekit.sharableLinks.createLink({
				linkIds,
			})

			const url = `${window.location.origin}/share/links/${result.id}`
			return url
		} catch (error) {
			console.error("Error creating sharable link:", error)
			toast.error("Помилка", {
				description: "Не вдалося створити посилання для поділу",
			})
			return null
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Отримати посилання за ID sharable ссылки
	 */
	const getSharableLink = async (linkId: string): Promise<SharableLink | null> => {
		try {
			isLoading.value = true

			const result = await $nurekit.sharableLinks.getLink(linkId)

			return result
		} catch (error) {
			console.error("Error getting sharable link:", error)
			toast.error("Помилка", {
				description: "Не вдалося завантажити посилання",
			})
			return null
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * Прийняти sharable посилання (імпортувати себе)
	 */
	const acceptSharableLink = async (linkId: string): Promise<boolean> => {
		try {
			isLoading.value = true

			await $nurekit.sharableLinks.acceptLink(linkId)

			toast.success("Успішно", {
				description: "Посилання успішно імпортовані",
			})
			return true
		} catch (error) {
			console.error("Error accepting sharable link:", error)
			toast.error("Помилка", {
				description: "Не вдалося імпортувати посилання",
			})
			return false
		} finally {
			isLoading.value = false
		}
	}

	return {
		isLoading,
		createSharableLink,
		getSharableLink,
		acceptSharableLink,
	}
}

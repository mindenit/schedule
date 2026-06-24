import { ref } from "vue"
import type { Link } from "nurekit"

export interface SharableLink {
	id: string
	links: Link[]
}

export const useSharableLinks = () => {
	const { $nurekit } = useNuxtApp()
	const isLoading = ref(false)

	// Ensure a persistent client ID cookie exists for sharable link ownership
	if (import.meta.client) {
		const cookieName = "schedule-client-id"
		const cookie = useCookie(cookieName, { maxAge: 60 * 60 * 24 * 365 })
		if (!cookie.value) {
			cookie.value = randomUUID()
		}
	}

	const createSharableLink = async (linkIds: string[]): Promise<string | null> => {
		if (linkIds.length === 0) {
			useSonner.error("Помилка", {
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
			useSonner.error("Помилка", {
				description: "Не вдалося створити посилання для поділу",
			})
			return null
		} finally {
			isLoading.value = false
		}
	}

	const getSharableLink = async (linkId: string): Promise<SharableLink | null> => {
		try {
			isLoading.value = true

			const result = await $nurekit.sharableLinks.getLink(linkId)

			return result
		} catch (error) {
			console.error("Error getting sharable link:", error)
			useSonner.error("Помилка", {
				description: "Не вдалося завантажити посилання",
			})
			return null
		} finally {
			isLoading.value = false
		}
	}

	const acceptSharableLink = async (linkId: string): Promise<boolean> => {
		try {
			isLoading.value = true

			await $nurekit.sharableLinks.acceptLink(linkId)

			useSonner.success("Успішно", {
				description: "Посилання успішно імпортовані",
			})
			return true
		} catch (error) {
			console.error("Error accepting sharable link:", error)
			useSonner.error("Помилка", {
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

export default defineNuxtRouteMiddleware((to) => {
	if (to.path === "/blocked") {
		return
	}

	const getUserAgent = () => {
		if (import.meta.server) {
			const headers = useRequestHeaders()
			return headers["user-agent"] || ""
		} else {
			return navigator.userAgent || ""
		}
	}

	const userAgent = getUserAgent()
	const isYandex =
		userAgent.toLowerCase().includes("yabrowser") || userAgent.toLowerCase().includes("yandex")

	if (isYandex) {
		return navigateTo("/blocked")
	}
})

function parseCookies(cookieHeader: string) {
	const cookies: Record<string, string> = {}
	cookieHeader.split(";").forEach((cookie) => {
		const [name, ...rest] = cookie.split("=")
		if (name && rest.length) {
			cookies[name.trim()] = rest.join("=").trim()
		}
	})
	return cookies
}

export default defineNuxtRouteMiddleware((to) => {
	const config = useRuntimeConfig()
	const maintenance = config.public.maintenance

	if (!maintenance) {
		return
	}

	let devAccess = 0

	if (import.meta.server) {
		const event = useRequestEvent()
		const cookies = parseCookies(event?.node.req.headers.cookie || "")
		devAccess = parseInt(cookies.devAccess || "0")
	} else {
		const devAccessStorage = useLocalStorage("devAccess", 0)
		devAccess = devAccessStorage.value

		const devAccessCookie = useCookie("devAccess", { default: () => 0 })
		devAccessCookie.value = devAccess
	}

	if (devAccess === 1) {
		return
	}

	if (to.path !== "/maintenance") {
		return navigateTo("/maintenance")
	}
})

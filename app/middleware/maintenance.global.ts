import { STORAGE_KEYS } from "~/constants/storage"

export default defineNuxtRouteMiddleware((to) => {
	const config = useRuntimeConfig()
	const maintenance = !!config.public.maintenance

	if (!maintenance) {
		if (to.path === "/maintenance") {
			return navigateTo("/")
		}
		return
	}

	// `useCookie` reads from the request headers on the server and from
	// document.cookie on the client — no manual parsing or localStorage
	// fallback required.
	const devAccess = useCookie<number>(STORAGE_KEYS.devAccess, { default: () => 0 })

	if (Number(devAccess.value) === 1) {
		return
	}

	if (to.path !== "/maintenance") {
		return navigateTo("/maintenance")
	}
})

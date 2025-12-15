import { Nurekit } from "nurekit"

export default defineNuxtPlugin(() => {
	let nurekit: Nurekit

	if (process.env.NODE_ENV === "development") {
		let baseUrl: string
		if (import.meta.server) {
			const host = process.env.NUXT_HOST || "localhost"
			const port = process.env.NUXT_PORT || "3000"
			baseUrl = `http://${host}:${port}/api`
		} else {
			baseUrl = `${window.location.origin}/api`
		}
		nurekit = new Nurekit(baseUrl)
	} else {
		nurekit = new Nurekit()
	}

	return {
		provide: {
			nurekit,
		},
	}
})

import { Nurekit } from "nurekit"

export default defineNuxtPlugin(() => {
	const nurekit = new Nurekit()

	return {
		provide: {
			nurekit,
		},
	}
})

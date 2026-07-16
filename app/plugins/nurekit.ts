import { Nurekit } from "nurekit"

declare module "#app" {
	interface NuxtApp {
		$nurekit: Nurekit
	}
}

export default defineNuxtPlugin(() => {
	return {
		provide: {
			nurekit: new Nurekit(),
		},
	}
})

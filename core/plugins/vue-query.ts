import type { DehydratedState, VueQueryPluginOptions } from "@tanstack/vue-query"
import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from "@tanstack/vue-query"
import { defineNuxtPlugin, useState } from "#imports"

export default defineNuxtPlugin((nuxt) => {
	const vueQueryState = useState<DehydratedState | null>("vue-query")

	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: 24 * 60 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000 } },
	})
	const options: VueQueryPluginOptions = { queryClient }

	nuxt.vueApp.use(VueQueryPlugin, options)

	if (import.meta.server) {
		nuxt.hooks.hook("app:rendered", () => {
			vueQueryState.value = dehydrate(queryClient)
		})
	}

	if (import.meta.client) {
		hydrate(queryClient, vueQueryState.value)
	}
})

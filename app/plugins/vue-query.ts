import type { DehydratedState, VueQueryPluginOptions } from "@tanstack/vue-query"
import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from "@tanstack/vue-query"
import { persistQueryClient } from "@tanstack/query-persist-client-core"
import { createStore, get, set, del } from "idb-keyval"

const IDB_DB_NAME = "mindenit-schedule"
const IDB_STORE_NAME = "query-cache"
const IDB_KEY = "tanstack-query"
const IDB_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days — TTL for the persisted blob

export default defineNuxtPlugin(async (nuxt) => {
	const vueQueryState = useState<DehydratedState | null>("vue-query")

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// staleTime / gcTime are set per-query in app/queries/*.ts via STALE_TIME_* constants.
				// These are catch-all fallbacks for any query that doesn't specify its own.
				staleTime: 1000 * 60 * 60, // 1 hour
				// gcTime must be >= IDB_MAX_AGE so data isn't GC'd before IDB can read it back
				gcTime: IDB_MAX_AGE,
			},
		},
	})
	const options: VueQueryPluginOptions = { queryClient }

	nuxt.vueApp.use(VueQueryPlugin, options)

	if (import.meta.server) {
		nuxt.hooks.hook("app:rendered", () => {
			vueQueryState.value = dehydrate(queryClient)
		})
	}

	if (import.meta.client) {
		// Hydrate from SSR state first (fast path — avoids empty flash)
		hydrate(queryClient, vueQueryState.value)

		// Layer on IndexedDB persistence for offline / cross-reload survival.
		// buster = buildId: changes on every deploy → wipes stale IDB blob automatically.
		const config = useRuntimeConfig()
		const idbStore = createStore(IDB_DB_NAME, IDB_STORE_NAME)

		const persister = {
			persistClient: async (client: unknown) => {
				await set(IDB_KEY, client, idbStore)
			},
			restoreClient: async () => {
				return await get(IDB_KEY, idbStore)
			},
			removeClient: async () => {
				await del(IDB_KEY, idbStore)
			},
		}

		// persistQueryClient returns [unsubscribe, restorePromise].
		// Await the restore so IDB cache is hydrated before the first render on reload.
		const [unsubscribe, restorePromise] = persistQueryClient({
			queryClient,
			persister,
			maxAge: IDB_MAX_AGE,
			buster: config.public.buildId,
		})

		await restorePromise

		nuxt.vueApp.onUnmount(unsubscribe)
	}
})

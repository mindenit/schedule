/**
 * Service worker registration — client-side only.
 * Skipped in dev: a SW over Vite's dev server causes stale-module chaos
 * (old hashed chunk URLs become unreachable when Vite invalidates them).
 */
export default defineNuxtPlugin(() => {
	if (import.meta.dev || !("serviceWorker" in navigator)) return

	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch((err) => {
			console.error("[SW] registration failed:", err)
		})
	})
})

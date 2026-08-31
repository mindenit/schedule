/**
 * Service worker registration — client-side only.
 * In dev: actively unregister any existing SW and clear mindenit-* caches so
 * a previously-installed prod/preview SW cannot intercept Vite's dev URLs.
 */
export default defineNuxtPlugin(() => {
	if (!("serviceWorker" in navigator)) return

	if (import.meta.dev) {
		// Tear down any leftover SW from a previous preview/prod run.
		navigator.serviceWorker
			.getRegistrations()
			.then((regs) => regs.forEach((r) => r.unregister()))
		caches
			.keys()
			.then((keys) =>
				keys.filter((k) => k.startsWith("mindenit-")).forEach((k) => caches.delete(k))
			)
		return
	}

	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch((err) => {
			console.error("[SW] registration failed:", err)
		})
	})
})

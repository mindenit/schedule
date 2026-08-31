/**
 * Mindenit Schedule — Service Worker
 *
 * Strategies:
 *   navigate requests  → NetworkFirst (shell), falls back to cached exact URL then "/"
 *   /_nuxt/, /_fonts/  → CacheFirst  (content-hashed, immutable)
 *   /_icons/           → StaleWhileRevalidate (icon bundles, server-rendered)
 *   /api/              → bypass      (TanStack IDB owns all schedule data)
 *   everything else    → bypass
 *
 * ponytail: CACHE_VERSION bump required when SW logic changes; activating a new
 * worker with a mismatched asset cache causes a white-screen for offline users
 * until they regain connectivity.
 */

const CACHE_VERSION = "v3"
const SHELL_CACHE = `mindenit-shell-${CACHE_VERSION}`
const ASSET_CACHE = `mindenit-assets-${CACHE_VERSION}`
// Max static-asset entries so old deploy chunks don't accumulate indefinitely.
// ponytail: FIFO trim, upgrade to LRU if 300 measurably causes issues.
const ASSET_CACHE_MAX = 300

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(SHELL_CACHE)
			// Pre-cache the app shell so offline works even on the very first
			// navigation before the user has loaded any route.
			.then((cache) => cache.add("/"))
			.then(() => self.skipWaiting())
	)
})

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
						.map((k) => caches.delete(k))
				)
			)
			.then(() => self.clients.claim())
	)
})

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
	const { request } = event
	const url = new URL(request.url)

	// Only intercept GET requests on the same origin.
	if (request.method !== "GET" || url.origin !== location.origin) return

	const path = url.pathname

	// /api/* — never touch; TanStack Query + IndexedDB own schedule freshness.
	if (path.startsWith("/api/")) return

	if (request.mode === "navigate") {
		event.respondWith(networkFirstShell(request))
		return
	}

	// Content-hashed assets: /_nuxt/, /_fonts/ — immutable, cache forever.
	if (path.startsWith("/_nuxt/") || path.startsWith("/_fonts/")) {
		event.respondWith(cacheFirstAsset(request))
		return
	}

	// Icon bundles: /_icons/ — serve stale, revalidate in background.
	if (path.startsWith("/_icons/")) {
		event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
		return
	}
})

// ── Strategies ────────────────────────────────────────────────────────────────

async function networkFirstShell(request) {
	const cache = await caches.open(SHELL_CACHE)
	// Key by pathname only — query params (view, date, schedule, type) are read
	// client-side by useUrlState after hydration, so different URLs share the
	// same shell HTML. Prevents unbounded entry growth per query-string combo.
	const key = new URL(request.url).pathname
	try {
		const response = await fetch(request)
		if (response.ok) cache.put(key, response.clone())
		return response
	} catch {
		// Network failed — try the exact path, then fall back to root shell.
		const cached = (await cache.match(key)) ?? (await cache.match("/"))
		if (cached) return cached
		return new Response("Offline — no cached shell available", {
			status: 503,
			headers: { "Content-Type": "text/plain" },
		})
	}
}

async function cacheFirstAsset(request) {
	const cache = await caches.open(ASSET_CACHE)
	const cached = await cache.match(request)
	if (cached) return cached

	try {
		const response = await fetch(request)
		if (response.ok) {
			cache.put(request, response.clone())
			trimCache(cache, ASSET_CACHE_MAX)
		}
		return response
	} catch {
		return new Response("Asset unavailable offline", {
			status: 503,
			headers: { "Content-Type": "text/plain" },
		})
	}
}

async function staleWhileRevalidate(request, cacheName) {
	const cache = await caches.open(cacheName)
	const cached = await cache.match(request)

	const fetchPromise = fetch(request)
		.then((response) => {
			if (response.ok) cache.put(request, response.clone())
			return response
		})
		.catch(
			() =>
				new Response("Resource unavailable offline", {
					status: 503,
					headers: { "Content-Type": "text/plain" },
				})
		)

	return cached ?? fetchPromise
}

// Trim oldest entries beyond `max` to prevent unbounded growth.
async function trimCache(cache, max) {
	const keys = await cache.keys()
	if (keys.length > max) {
		await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)))
	}
}

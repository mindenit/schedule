/**
 * Generate a RFC 4122 v4 UUID.
 *
 * Falls back gracefully when crypto.randomUUID() is unavailable — which
 * happens on insecure HTTP origins in mobile Chrome / WebViews (secure-context
 * restriction in the WebCrypto spec). crypto.getRandomValues() is available
 * in insecure contexts in all browsers we support (Chrome 11+, iOS Safari 6+).
 *
 * Tier 1: crypto.randomUUID()          — modern, secure contexts only
 * Tier 2: crypto.getRandomValues()     — available everywhere, including HTTP
 * Tier 3: Math.random()                — last resort, non-cryptographic
 *
 * Use this everywhere instead of calling crypto.randomUUID() directly.
 */
export function randomUUID(): string {
	// Tier 1
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID()
	}

	// Tier 2: construct RFC 4122 v4 UUID from getRandomValues
	if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
		const bytes = new Uint8Array(16)
		crypto.getRandomValues(bytes)
		// version 4
		bytes[6] = (bytes[6]! & 0x0f) | 0x40
		// variant 10xx
		bytes[8] = (bytes[8]! & 0x3f) | 0x80
		const hex: string[] = []
		for (let i = 0; i < 16; i++) hex.push(bytes[i]!.toString(16).padStart(2, "0"))
		return (
			hex.slice(0, 4).join("") +
			"-" +
			hex.slice(4, 6).join("") +
			"-" +
			hex.slice(6, 8).join("") +
			"-" +
			hex.slice(8, 10).join("") +
			"-" +
			hex.slice(10, 16).join("")
		)
	}

	// Tier 3: Math.random — should never be reached in modern environments
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0
		const v = c === "x" ? r : (r & 0x3) | 0x8
		return v.toString(16)
	})
}

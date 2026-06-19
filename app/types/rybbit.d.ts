interface Rybbit {
	/** Tracks a pageview manually. */
	pageview: () => void

	/**
	 * Tracks a custom event.
	 * @param name - Event name (max 255 characters).
	 * @param properties - Optional key/value properties (max 2KB, string/number values only).
	 */
	event: (name: string, properties?: Record<string, string | number>) => void

	/**
	 * Associates subsequent events with a user identity.
	 * @param userId - Stable identifier for the user.
	 * @param traits - Optional metadata (email, name, custom fields).
	 */
	identify: (userId: string, traits?: Record<string, unknown>) => void

	/** Merges additional traits onto the currently identified user. */
	setTraits: (traits: Record<string, unknown>) => void

	/** Clears the stored user ID (e.g. on logout). */
	clearUserId: () => void

	/** Returns the currently stored user ID, or null if not set. */
	getUserId: () => string | null

	/**
	 * Manually tracks an outbound link click.
	 * @param url - Destination URL.
	 * @param text - Optional link text.
	 * @param target - Optional anchor target attribute.
	 */
	trackOutbound: (url: string, text?: string, target?: string) => void
}

declare global {
	interface Window {
		rybbit: Rybbit
	}
}

export {}

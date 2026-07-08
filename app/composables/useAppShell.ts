import { storeToRefs } from "pinia"
import { useSettingsStore } from "~/stores/settings"

/**
 * Wires up app-level concerns that previously lived inline in `app.vue`:
 *
 *  - analytics bootstrap (`useAnalytics`)
 *  - global keyboard shortcuts (`useKeyboardShortcuts` → exposes `isShortcutsOpen`)
 *  - root `<html lang>` attribute via `useHead`
 *  - WebSite Schema.org JSON-LD via `useSchemaOrg`
 *  - `isSnowEnabled` reactive flag for the seasonal canvas
 *
 * Returning a small object keeps `app.vue` declarative: it only renders.
 * Add new global-shell concerns here rather than in `app.vue`.
 */
export function useAppShell() {
	const { isSnowEnabled } = storeToRefs(useSettingsStore())

	useAnalytics()
	const { isShortcutsOpen } = useKeyboardShortcuts()

	useHead({ htmlAttrs: { lang: SEO_DEFAULT_LOCALE } })

	useSchemaOrg([
		defineWebSite({
			name: SEO_SITE_NAME,
			alternateName: SEO_SITE_ALTERNATE_NAME,
			description: SEO_DEFAULT_DESCRIPTION,
			inLanguage: SEO_INLANGUAGE,
		}),
	])

	return {
		isSnowEnabled,
		isShortcutsOpen,
	}
}

import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
	compatibilityDate: "2024-11-01",
	devtools: { enabled: true },
	// Component registration: Ui (UI Thing) comes first so Nuxt assigns the Ui prefix.
	// Prefixed feature subdirs must come before the catch-all ~/components entry.
	components: [
		{ path: "~/components/Ui", prefix: "Ui" },
		{ path: "~/components/calendar", prefix: "BigCalendar", pathPrefix: false },
		{ path: "~/components/schedule", prefix: "Schedule", pathPrefix: false },
		{ path: "~/components/filters", prefix: "Filters", pathPrefix: false },
		{ path: "~/components/links", prefix: "Links", pathPrefix: false },
		{ path: "~/components", pathPrefix: false, extensions: [".vue"] },
	],
	imports: {
		dirs: ["~/types", "~/constants", "~/queries"],
		imports: [
			{ from: "tailwind-variants", name: "tv" },
			{ from: "tailwind-variants", name: "VariantProps", type: true },
			{
				from: "vue-sonner",
				name: "toast",
				as: "useSonner",
			},
		],
	},
	runtimeConfig: {
		public: {
			maintenance: process.env.MAINTENANCE === "true",
		},
	},
	modules: [
		"@nuxt/eslint",
		"@nuxt/icon",
		"@nuxt/scripts",
		"@nuxtjs/color-mode",
		"@vueuse/nuxt",
		"@pinia/nuxt",
		"@nuxt/image",
		"@nuxtjs/seo",
		"@yuta-inoue-ph/nuxt-vcalendar",
		"vue-sonner/nuxt",
	],
	css: ["~/assets/css/main.css", "~/assets/css/tailwind.css"],
	vite: {
		plugins: [tailwindcss()],
	},
	icon: {
		provider: "iconify",
		serverBundle: {
			collections: ["lucide"],
		},
	},
	colorMode: {
		preference: "system",
		fallback: "light",
		classSuffix: "",
		storageKey: "nuxt-color-mode",
	},
	site: {
		url: "https://sh.mindenit.org",
		name: "Mindenit Schedule",
		description:
			"Зручний перегляд розкладу занять для студентів та викладачів. Додавайте розклади груп, викладачів та аудиторій, переглядайте їх у зручному форматі по днях, тижнях або на місяць. Швидкий доступ до розкладу у будь-який час.",
		defaultLocale: "uk",
		trailingSlash: false,
		indexable: true,
		debug: import.meta.dev,
	},
	robots: {
		sitemap: "/sitemap.xml",
		disallow: ["/blocked"],
	},
	sitemap: {
		exclude: ["/blocked"],
	},
	seo: {
		redirectToCanonicalSiteUrl: true,
		fallbackTitle: true,
		automaticDefaults: true,
		metaDataFiles: true,
		meta: {
			ogType: "website",
			twitterCard: "summary_large_image",
			ogLocale: "uk_UA",
		},
	},
})

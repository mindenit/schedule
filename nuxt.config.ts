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
			maintenance: false,
			// Bumped on every build — used to bust the IndexedDB query cache on deploy
			buildId: String(Date.now()),
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
		"@nuxt/fonts",
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
	// Site identity — values mirrored in app/constants/seo.ts (auto-imported in app code)
	site: {
		url: "https://sh.mindenit.org",
		name: "Mindenit Schedule",
		description:
			"Зручний перегляд розкладу занять для студентів та викладачів. " +
			"Додавайте розклади груп, викладачів та аудиторій, переглядайте їх у зручному форматі " +
			"по днях, тижнях або на місяць. Швидкий доступ до розкладу у будь-який час.",
		defaultLocale: "uk",
		trailingSlash: false,
		indexable: true,
		debug: import.meta.dev,
	},
	// routeRules-based robots/sitemap control (server-level, no per-page useSeoMeta needed)
	routeRules: {
		"/blocked": { robots: false, sitemap: false },
		"/maintenance": { robots: false, sitemap: false },
		"/share/**": { robots: false, sitemap: false },
	},
	robots: {
		sitemap: "/sitemap.xml",
	},
	sitemap: {
		exclude: ["/blocked", "/maintenance", "/share/**"],
	},
	seo: {
		redirectToCanonicalSiteUrl: true,
		fallbackTitle: true,
		automaticDefaults: true,
		meta: {
			titleTemplate: "%s | Mindenit Schedule",
			description:
				"Зручний перегляд розкладу занять для студентів та викладачів. " +
				"Додавайте розклади груп, викладачів та аудиторій, переглядайте їх у зручному форматі " +
				"по днях, тижнях або на місяць. Швидкий доступ до розкладу у будь-який час.",
			ogType: "website",
			ogLocale: "uk_UA",
			ogSiteName: "Mindenit Schedule",
			twitterCard: "summary_large_image",
			applicationName: "Mindenit Schedule",
			themeColor: [
				{ content: "#ffffff", media: "(prefers-color-scheme: light)" },
				{ content: "#090f1f", media: "(prefers-color-scheme: dark)" },
			],
		},
	},
	fonts: {
		families: [
			{
				name: "Inter",
				provider: "google",
				weights: [400, 600, 700],
				subsets: ["latin", "cyrillic"],
				global: true,
			},
			{
				name: "Afacad",
				provider: "google",
				weights: [400, 700],
				subsets: ["latin", "cyrillic"],
				global: true,
			},
			{
				name: "Fira Code",
				provider: "google",
				weights: [400, 500],
				subsets: ["latin", "cyrillic"],
				global: true,
			},
		],
	},
	// Schema.org identity — values mirrored in app/constants/seo.ts
	// Note: org URL (mindenit.org) differs from site URL (sh.mindenit.org)
	// Note: logo uses team logo (mindenit-logo.webp), NOT the schedule product logo (logo.svg)
	schemaOrg: {
		identity: {
			type: "Organization",
			name: "Mindenit",
			slogan: "Інноваційні Програмні Рішення",
			url: "https://mindenit.org",
			logo: {
				url: "/mindenit-logo.webp",
				width: 320,
				height: 320,
			},
			description:
				"Цифрова студія повного циклу. Веб-розробка, мобільні застосунки та custom software " +
				"для бізнесу з гарантією результату. Офіційний партнер НУРЕ.",
			foundingDate: "2023",
			email: "ketronix@gmail.com",
			sameAs: [
				"https://github.com/mindenit",
				"https://t.me/mindenit",
				"https://discord.gg/ahKR75hU9h",
			],
			contactPoint: {
				contactType: "customer support",
				url: "https://t.me/mindenit",
				email: "ketronix@gmail.com",
			},
		},
	},
	ogImage: {
		defaults: {
			width: 1200,
			height: 630,
			cacheMaxAgeSeconds: 60 * 60 * 24 * 7,
		},
		fontSubsets: ["latin", "cyrillic"],
	},
})

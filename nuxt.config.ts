import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
	compatibilityDate: "2024-11-01",
	devtools: { enabled: true },
	extends: ["./core", "./layers/site", "./layers/calendar/", "./layers/schedule/"],
	imports: {
		dirs: [
			"./core/types",
			"./core/constants",
			"./layers/**/types",
			"./layers/**/queries",
			"./layers/**/constants",
		],
	},
	runtimeConfig: {
		public: {
			maintenance: process.env.MAINTENANCE === "true" ? true : false,
		},
	},
	modules: [
		"@nuxt/eslint",
		"@nuxt/icon",
		"@nuxtjs/color-mode",
		"@vueuse/nuxt",
		"shadcn-nuxt",
		"@pinia/nuxt",
		"@nuxt/image",
		"@nuxtjs/seo",
		"@vite-pwa/nuxt",
	],
	css: ["~/core/assets/css/main.css"],
	shadcn: {
		prefix: "",
		componentDir: "./core/components/ui",
	},
	vite: {
		plugins: [tailwindcss()],
		server: {
			allowedHosts: ["87f83efd5e10.ngrok-free.app"],
		},
	},
	pinia: {
		storesDirs: ["./**/stores/**"],
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
		name: "Mindenit Schedule",
		description:
			"Зручний перегляд розкладу занять для студентів та викладачів. Додавайте розклади груп, викладачів та аудиторій, переглядайте їх у зручному форматі по днях, тижнях або на місяць. Швидкий доступ до розкладу у будь-який час.",
		defaultLocale: "uk",
		trailingSlash: false,
		indexable: true,
		debug: process.env.NODE_ENV === "development",
	},
	robots: {
		sitemap: "/sitemap.xml",
		disallow: ["/faggots"],
	},
	sitemap: {
		exclude: ["/faggots"],
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
	pwa: {
		registerType: "autoUpdate",
		registerWebManifestInRouteRules: true,
		workbox: {
			navigateFallback: "/",
			globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
			globIgnores: ["**/authors/**"],
			maximumFileSizeToCacheInBytes: 5000000, // 5MB
		},
		client: {
			installPrompt: true,
			registerPlugin: true,
		},
		manifest: {
			name: "Mindenit Schedule",
			short_name: "Schedule",
			description:
				"Зручний перегляд розкладу занять для студентів та викладачів. Додавайте розклади груп, викладачів та аудиторій.",
			theme_color: "#6368F2",
			background_color: "#ffffff",
			display: "standalone",
			orientation: "portrait",
			scope: "/",
			start_url: "/",
			id: "/",
			lang: "uk",
			categories: ["education", "productivity"],
			icons: [
				{
					src: "pwa/android/android-launchericon-192-192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "any",
				},
				{
					src: "pwa/android/android-launchericon-512-512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "any",
				},
				{
					src: "pwa/android/android-launchericon-192-192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "maskable",
				},
				{
					src: "pwa/android/android-launchericon-512-512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "maskable",
				},
				{
					src: "pwa/ios/180.png",
					sizes: "180x180",
					type: "image/png",
				},
				{
					src: "pwa/ios/152.png",
					sizes: "152x152",
					type: "image/png",
				},
				{
					src: "pwa/ios/120.png",
					sizes: "120x120",
					type: "image/png",
				},
				// Favicon
				{
					src: "favicon.ico",
					sizes: "32x32",
					type: "image/x-icon",
				},
			],
		},
		devOptions: {
			enabled: true,
			type: "module",
		},
	},
})

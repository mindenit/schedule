export default defineNuxtPlugin(() => {
	useHead({
		meta: [
			{ name: "apple-mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
			{ name: "apple-mobile-web-app-title", content: "Schedule" },
			{ name: "mobile-web-app-capable", content: "yes" },
			{ name: "msapplication-TileColor", content: "#6368F2" },
			{ name: "theme-color", content: "#6368F2" },
		],
		link: [
			{ rel: "apple-touch-icon", href: "/pwa/ios/180.png" },
			{ rel: "apple-touch-icon", sizes: "180x180", href: "/pwa/ios/180.png" },
			{ rel: "apple-touch-icon", sizes: "152x152", href: "/pwa/ios/152.png" },
			{ rel: "apple-touch-icon", sizes: "120x120", href: "/pwa/ios/120.png" },
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				href: "/pwa/android/android-launchericon-192-192.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "512x512",
				href: "/pwa/android/android-launchericon-512-512.png",
			},
			{ rel: "mask-icon", href: "/logo.svg", color: "#6368F2" },
		],
	})
})

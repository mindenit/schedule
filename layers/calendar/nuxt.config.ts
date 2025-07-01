export default defineNuxtConfig({
	extends: ["../site"],
	components: [{ path: "./components", prefix: "BigCalendar", pathPrefix: false }],
})

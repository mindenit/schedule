export default defineNuxtConfig({
	extends: ["../site"],
	components: [{ path: "./components", prefix: "Schedule", pathPrefix: false }],
})

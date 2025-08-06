<script lang="ts" setup>
import "vue-sonner/style.css"

useHead({
	script: [
		{
			src: "https://analytics.mindenit.org/api/script.js",
			defer: true,
			"data-site-id": "3",
			"data-track-errors": "true",
			"data-session-replay": "true",
		},
	],
})
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<Toaster position="top-right" richColors />
</template>

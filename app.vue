<script lang="ts" setup>
import "vue-sonner/style.css"

const snowCount = 400
const snowSpeed = 1
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<SnowEffect :count="snowCount" :speed="snowSpeed" />
	<Toaster position="top-right" richColors />
</template>

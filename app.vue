<script lang="ts" setup>
import "vue-sonner/style.css"
import { storeToRefs } from "pinia"
import { useSettingsStore } from "@/core/stores/settings"

const settingsStore = useSettingsStore()
const { isSnowEnabled } = storeToRefs(settingsStore)

const snowCount = 400
const snowSpeed = 1
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<!-- <ClientOnly>
		<SnowEffect v-if="isSnowEnabled" :count="snowCount" :speed="snowSpeed" />
	</ClientOnly> -->
	<Toaster position="top-right" rich-colors />
</template>

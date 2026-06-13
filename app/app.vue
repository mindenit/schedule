<script lang="ts" setup>
import "vue-sonner/style.css"
import { storeToRefs } from "pinia"
import { useSettingsStore } from "~/stores/settings"

const { isSnowEnabled } = storeToRefs(useSettingsStore())
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<ClientOnly>
		<SnowEffect v-if="isSnowEnabled" />
	</ClientOnly>
	<Toaster position="top-right" rich-colors />
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { useSettingsStore } from "~/stores/settings"

const { isSnowEnabled } = storeToRefs(useSettingsStore())

useAnalytics()
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<ClientOnly>
		<SnowEffect v-if="isSnowEnabled" />
	</ClientOnly>
	<UiSonner />
</template>

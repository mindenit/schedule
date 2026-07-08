<script lang="ts" setup>
import { defineAsyncComponent } from "vue"

/**
 * SnowEffect is a ~500 LOC seasonal canvas component that's off by default.
 * Loading it lazily keeps it out of the initial JS bundle so users who never
 * toggle the setting pay nothing for it. Wrapped in <ClientOnly> already, so
 * SSR doesn't try to resolve the dynamic import.
 */
const SnowEffect = defineAsyncComponent(() => import("~/components/SnowEffect.vue"))

const { isSnowEnabled, isShortcutsOpen } = useAppShell()
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
	<AppShortcutsDialog v-model:open="isShortcutsOpen" />
	<ScheduleAddDialog />
</template>

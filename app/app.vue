<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { useSettingsStore } from "~/stores/settings"

const { isSnowEnabled } = storeToRefs(useSettingsStore())

useAnalytics()

useHead({ htmlAttrs: { lang: SEO_DEFAULT_LOCALE } })

useSchemaOrg([
	defineWebSite({
		name: SEO_SITE_NAME,
		alternateName: SEO_SITE_ALTERNATE_NAME,
		description: SEO_DEFAULT_DESCRIPTION,
		inLanguage: SEO_INLANGUAGE,
	}),
])
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

<script lang="ts" setup>
import "vue-sonner/style.css"
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<Toaster position="top-right" rich-colors />
</template>

<script setup lang="ts">
const isDev = import.meta.dev
</script>

<template>
	<slot v-if="isDev" />
</template>

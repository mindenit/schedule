<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from "vue-sonner"

const props = defineProps<ToasterProps>()
</script>

<template>
	<Sonner
		class="toaster group"
		v-bind="props"
		:style="{
			'--normal-bg': 'var(--popover)',
			'--normal-text': 'var(--popover-foreground)',
			'--normal-border': 'var(--border)',

			'--success-bg': 'var(--success)',
			'--success-text': 'var(--success-foreground)',
			'--success-border': 'var(--success)',

			'--warning-bg': 'var(--warning)',
			'--warning-text': 'var(--warning-foreground)',
			'--warning-border': 'var(--warning)',

			'--error-bg': 'var(--destructive)',
			'--error-text': 'var(--destructive-foreground)',
			'--error-border': 'var(--destructive)',

			'--info-bg': 'var(--secondary)',
			'--info-text': 'var(--secondary-foreground)',
			'--info-border': 'var(--secondary)',
		}"
	/>
</template>

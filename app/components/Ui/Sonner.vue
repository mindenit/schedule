<template>
	<Toaster
		class="toaster group"
		position="top-right"
		rich-colors
		:visible-toasts="5"
		close-button
		:duration="3000"
		:theme="$colorMode.value == 'dark' ? 'dark' : 'light'"
		:style="{
			'--normal-bg': 'var(--popover)',
			'--normal-text': 'var(--popover-foreground)',
			'--normal-border': 'var(--border)',
		}"
		:toast-options="{
			class: 'items-start!',
			classes: {
				icon: 'mt-0.5',
				toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
				description: 'group-[.toast]:text-muted-foreground',
				actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
				cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
			},
		}"
	/>
</template>

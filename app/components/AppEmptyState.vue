<script setup lang="ts">
interface Props {
	icon?: string
	title?: string
	description?: string
	variant?: "overlay" | "card" | "sidebar" | "inline"
}

withDefaults(defineProps<Props>(), {
	variant: "inline",
	icon: undefined,
	title: undefined,
	description: undefined,
})
</script>

<template>
	<!-- Blurred backdrop overlay with centered card -->
	<Transition
		v-if="variant === 'overlay'"
		enter-active-class="transition-opacity duration-300 ease-out"
		enter-from-class="opacity-0"
		enter-to-class="opacity-100"
		leave-active-class="transition-opacity duration-200 ease-in"
		leave-from-class="opacity-100"
		leave-to-class="opacity-0"
	>
		<div
			v-if="variant === 'overlay'"
			class="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm"
		>
			<div class="border-border bg-card mx-4 rounded-lg border p-6 shadow-lg">
				<div class="flex items-center gap-4">
					<AppIcon v-if="icon" :name="icon" class="shrink-0" />
					<div>
						<h3 v-if="title" class="text-lg font-semibold">{{ title }}</h3>
						<p v-if="description" class="text-sm">{{ description }}</p>
					</div>
				</div>
			</div>
		</div>
	</Transition>

	<!-- Bordered card without backdrop -->
	<div v-else-if="variant === 'card'" class="border-border bg-card rounded-lg border p-6 shadow-lg">
		<div class="flex items-center gap-4">
			<AppIcon v-if="icon" :name="icon" class="shrink-0" />
			<div>
				<h3 v-if="title" class="text-lg font-semibold">{{ title }}</h3>
				<p v-if="description" class="text-sm">{{ description }}</p>
				<div v-if="$slots.actions" class="mt-3">
					<slot name="actions" />
				</div>
			</div>
		</div>
	</div>

	<!-- Centered column with large faded icon — for sidebars -->
	<div
		v-else-if="variant === 'sidebar'"
		class="text-muted-foreground flex flex-col items-center justify-center gap-2 p-6 text-center"
	>
		<AppIcon v-if="icon" :name="icon" size="xl" class="opacity-50" />
		<p v-if="title || description" class="text-sm">
			<template v-if="title">{{ title }}</template>
			<template v-if="description"><br />{{ description }}</template>
		</p>
	</div>

	<!-- Minimal centered muted text — for lists/dialogs -->
	<div v-else class="text-muted-foreground p-4 text-center text-sm">
		<slot>{{ title }}</slot>
	</div>
</template>

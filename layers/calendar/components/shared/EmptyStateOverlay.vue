<script setup lang="ts">
interface Props {
	show: boolean
	title?: string
	description?: string
}

withDefaults(defineProps<Props>(), {
	title: "Немає пар",
	description: "Немає заплнованих занять",
})
</script>

<template>
	<Transition
		enter-active-class="transition-all duration-300 ease-out"
		enter-from-class="opacity-0"
		enter-to-class="opacity-100"
		leave-active-class="transition-all duration-200 ease-in"
		leave-from-class="opacity-100"
		leave-to-class="opacity-0"
	>
		<div
			v-if="show"
			class="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm"
		>
			<div class="border-border bg-card rounded-lg border p-6 shadow-lg">
				<div class="flex items-center">
					<AppIcon name="lucide:calendar-x" class="flex shrink-0" />
					<div class="ml-4">
						<h3 class="text-lg font-semibold">{{ title }}</h3>
						<div class="text-sm">
							<p>{{ description }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Transition>
</template>

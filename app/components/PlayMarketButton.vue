<script setup lang="ts">
withDefaults(
	defineProps<{
		switchOnMobile?: boolean
	}>(),
	{
		switchOnMobile: true,
	}
)
</script>

<template>
	<NuxtLink
		to="https://play.google.com/store/apps/details?id=com.mindenit.schedule&pcampaignid=web_share"
		target="_blank"
		rel="noopener noreferrer"
		class="flex shrink-0 items-center justify-center transition-all [@media(max-height:650px)]:hidden"
	>
		<img
			src="/google-play.png"
			alt="Завантажити в Play Market"
			class="h-12 cursor-pointer object-contain transition-all [@media(max-height:750px)]:h-8 [@media(max-height:850px)]:h-10"
			:class="{ 'hidden md:block': switchOnMobile }"
		/>
		<Button
			v-if="switchOnMobile"
			class="size-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl md:hidden"
			variant="secondary"
			size="icon"
		>
			<AppIcon name="logos:google-play-icon" size="lg" />
		</Button>
	</NuxtLink>
</template>

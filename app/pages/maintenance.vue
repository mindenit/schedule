<script setup lang="ts">
useSeo({
	title: "Технічні роботи",
	description:
		"Сайт тимчасово недоступний через планові технічні роботи. Скоро відновимо роботу.",
	noindex: true,
})

definePageMeta({
	layout: "maintenance",
})
</script>

<template>
	<div>
		<!-- SoftAurora WebGL background — client-only to avoid SSR canvas issues.
			 AmbientBlobs serves as a zero-dep fallback during hydration. -->
		<ClientOnly>
			<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
				<SoftAurora />
			</div>
			<template #fallback>
				<AmbientBlobs />
			</template>
		</ClientOnly>

		<main
			class="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 p-8 text-center"
		>
			<!-- WaitHand: original easter egg from the React-era version of this app.
				 Fingers animated via CSS keyframes in WaitHand.vue. Do not restyle. -->
			<WaitHand />

			<!-- Title -->
			<h1 class="text-3xl font-semibold tracking-[0.75%]">
				Сайт знаходиться в обслуговуванні
			</h1>

			<!-- Body copy -->
			<p class="text-lg leading-relaxed">
				Ми проводимо планові технічні роботи. Сайт скоро відновить свою роботу.<br />
				Якщо вам потрібно щось терміново — напишіть нам у Telegram.
			</p>

			<div class="flex w-full justify-center">
				<TelegramButton />
			</div>
		</main>
	</div>
</template>

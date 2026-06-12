<script setup lang="ts">
definePageMeta({
	layout: "maintenance",
})
</script>

<template>
	<div class="container mx-auto flex min-h-screen items-center justify-center px-4">
		<div class="flex w-full max-w-lg flex-col items-center gap-8 rounded-lg p-8 text-center">
			<div>
				<WaitHand />
			</div>
			<h1 class="text-3xl font-semibold tracking-[0.75%]">Сайт знаходиться в обслуговуванні</h1>
			<p class="text-lg">
				Ми проводимо планові технічні роботи. Сайт скоро відновить свою роботу.<br />
				Якщо вам потрібно щось терміново — напишіть нам у Telegram.
			</p>
			<div class="flex w-full justify-center">
				<TelegramButton />
			</div>
		</div>
	</div>
</template>

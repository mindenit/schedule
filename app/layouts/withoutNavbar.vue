<template>
	<div class="relative flex w-full flex-col">
		<div class="container mx-auto flex h-dvh flex-col gap-5 px-4 pt-5">
			<div class="flex flex-col gap-5 pb-24 md:pb-5">
				<slot />
			</div>
		</div>
		<QrCode />
	</div>
</template>

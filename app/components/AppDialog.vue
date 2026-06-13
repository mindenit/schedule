<template>
	<DialogContent>
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<AppIcon name="logos:android-icon" size="lg" />
				Наш Android додаток
			</DialogTitle>
		</DialogHeader>
		<div class="flex w-full flex-col gap-4">
			<div class="flex items-center gap-3">
				<div class="bg-muted flex size-10 items-center justify-center rounded-full max-sm:hidden">
					<Icon name="lucide:zap" class="text-primary size-8" />
				</div>
				<div>
					<p class="font-medium">Встановіть наш додаток на Android</p>
					<p class="text-muted-foreground text-sm">Зручний доступ до розкладу з вашого телефону</p>
				</div>
			</div>
			<div class="grid w-full grid-cols-1 gap-2">
				<PlayMarketButton :switchOnMobile="false" />
			</div>
		</div>
	</DialogContent>
</template>

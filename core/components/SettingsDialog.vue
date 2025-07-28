<template>
	<Dialog>
		<DialogTrigger as-child>
			<Button size="icon" variant="outline">
				<AppIcon name="lucide:settings" />
			</Button>
		</DialogTrigger>
		<DialogContent class="flex max-h-[80vh] flex-col overflow-hidden md:max-w-4xl">
			<DialogHeader>
				<DialogTitle>Налаштування</DialogTitle>
			</DialogHeader>
			<SettingsMainView />
		</DialogContent>
	</Dialog>
</template>

<template>
	<div class="grid w-full grid-cols-3 items-center">
		<div class="flex items-center justify-start">
			<img src="/logo.svg" class="size-8" alt="Logo" />
			<span class="text-xl font-bold">Schedule</span>
		</div>

		<div class="flex items-center justify-center">
			<BigCalendarDateNavigator />
		</div>

		<div class="flex items-center justify-end gap-3">
			<BigCalendarViewSwitcher />
			<ThemeSwitcher />
		</div>
	</div>
</template>

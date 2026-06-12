<template>
	<div
		class="from-royal-blue-700/80 via-royal-blue-600/70 to-royal-blue-500/80 dark:from-royal-blue-600/60
			dark:via-royal-blue-500/50 dark:to-royal-blue-400/60 relative flex h-12 w-full
			animate-[gradient-x_6s_ease-in-out_infinite] items-center justify-center overflow-hidden
			bg-gradient-to-r bg-[length:200%_100%] px-4 text-white shadow-sm"
	>
		<div class="relative flex items-center justify-center gap-4">
			<div class="flex items-center gap-3">
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
					<AppIcon name="lucide:briefcase" size="xs" class="text-white" />
				</div>

				<span class="text-sm font-medium"> Шукаємо людей в команду </span>
			</div>

			<Button
				as="a"
				href="https://mindenit.org/hiring"
				target="_blank"
				rel="noopener noreferrer"
				variant="secondary"
				size="sm"
				class="h-7 border-white/25 bg-white/20 text-white backdrop-blur-sm transition-all duration-200
					hover:scale-105 hover:bg-white/30 active:scale-95"
			>
				<span class="text-xs">Долучитися</span>
				<AppIcon
					name="lucide:arrow-right"
					size="xs"
					class="ml-1 transition-transform duration-200 group-hover:translate-x-0.5"
				/>
			</Button>
		</div>
	</div>
</template>

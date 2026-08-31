<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v"

/**
 * Analytics consent banner — shown once when the user hasn't yet made a choice.
 *
 * Placement: fixed bottom center, above mobile nav-safe area.
 * Animation: slide up / fade on first appearance; fade out on dismiss.
 * Choice is persisted by useConsent() in localStorage (STORAGE_KEYS.analyticsConsent).
 */

const { isPending, acceptConsent, declineConsent } = useConsent()
</script>

<template>
	<ClientOnly>
		<Teleport to="body">
			<AnimatePresence>
				<motion.div
					v-if="isPending"
					key="consent-banner"
					role="dialog"
					aria-live="polite"
					aria-label="Згода на аналітику"
					:initial="{ opacity: 0, y: 24 }"
					:animate="{ opacity: 1, y: 0 }"
					:exit="{ opacity: 0, y: 16 }"
					:transition="{ duration: 0.25, ease: 'easeOut' }"
					class="fixed bottom-24 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg
						-translate-x-1/2 px-0 md:bottom-6"
				>
					<div
						class="border-border bg-card flex flex-col gap-3 rounded-xl border p-4
							shadow-lg sm:flex-row sm:items-center sm:gap-4 sm:p-4"
					>
						<!-- Text block -->
						<div class="min-w-0 flex-1">
							<p class="text-card-foreground text-sm font-medium">
								Аналітика використання
							</p>
							<p class="text-muted-foreground mt-0.5 text-xs leading-relaxed">
								Ми використовуємо Google Analytics, щоб розуміти, як користуються
								застосунком. Жодної реклами, жодного продажу даних. Відмова не
								впливає на роботу.
							</p>
						</div>

						<!-- Actions -->
						<div class="flex shrink-0 gap-2">
							<UiButton
								variant="outline"
								size="sm"
								class="h-8 px-3 text-xs"
								@click="declineConsent"
							>
								Відхилити
							</UiButton>
							<UiButton
								variant="default"
								size="sm"
								class="h-8 px-3 text-xs"
								@click="acceptConsent"
							>
								Прийняти
							</UiButton>
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		</Teleport>
	</ClientOnly>
</template>

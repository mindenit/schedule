<script lang="ts" setup>
useSeo({
	title: "Виявлено шкідливий браузер",
	noindex: true,
})

definePageMeta({
	layout: "without-navbar",
})
</script>

<template>
	<div class="container mx-auto rounded-lg p-2 shadow-md">
		<h1
			class="mb-6 text-center text-3xl font-semibold tracking-[0.75%] text-red-700
				dark:text-red-500"
		>
			УВАГА! ВИЯВЛЕНО ПІДОРСЬКЕ/ШПИГУНСЬКЕ ПРОГРАМНЕ ЗАБЕЗПЕЧЕННЯ
		</h1>
		<div class="space-y-6">
			<p class="text-xl leading-7 font-bold text-red-700 dark:text-red-500">
				Ваш пристрій інфіковано руснявим шпигунським програмним забезпеченням "яндекс браузер", яке
				загрожує вашій безпеці та національній безпеці України.
			</p>

			<div class="grid grid-cols-2 gap-2 max-md:grid-cols-1">
				<div class="rounded border-l-4 border-red-600 bg-red-100 p-5 dark:bg-red-900/40">
					<h3 class="mb-4 text-xl font-semibold tracking-[0.5%] text-red-800 dark:text-red-400">
						КРИТИЧНІ ЗАГРОЗИ НАЦІОНАЛЬНІЙ БЕЗПЕЦІ:
					</h3>
					<ul class="list-disc space-y-3 pl-5">
						<li>
							<p class="text-base leading-7 font-semibold dark:text-white">
								яндекс безпосередньо пов'язаний з фсб та підорськими спецслужбами, і передає їм ВСІ
								ваші особисті дані, включаючи паролі, повідомлення і геолокацію
							</p>
						</li>
						<li>
							<p class="text-base leading-7 font-semibold dark:text-white">
								Підтверджено використання яндекс як інструменту кібершпигунства - компанія проводить
								"тихі атаки" на українських користувачів, викрадаючи конфіденційну інформацію
							</p>
						</li>
						<li>
							<p class="text-base leading-7 font-semibold dark:text-white">
								Використовуючи цей браузер, ви ставите під загрозу інформацію про військові дії та
								можете несвідомо допомагати країні-агресору
							</p>
						</li>
					</ul>
				</div>

				<div class="rounded-lg bg-gradient-to-r from-red-700 to-red-900 p-6 text-white">
					<h2 class="mb-3 text-center text-2xl font-semibold tracking-[0.8%] text-white">
						ЧАС ДІЯТИ ЗАРАЗ!
					</h2>
					<p class="text-xl leading-7 font-bold text-white dark:text-white">
						Використання яндекс сервісів допомагає фінансувати російську агресію. Кожен клік, кожен
						запит і кожна хвилина використання яндекс та інших підорських сервісів — це підтримка
						війни проти України.
					</p>
					<div class="/20 mt-4 rounded-md p-3">
						<p size="paragraph" class="text-base leading-7 text-white dark:text-white">
							Після видалення яндекс браузера рекомендуємо:
							<span class="mt-2 block">1. Змінити всі паролі до важливих сервісів</span>
							<span class="block">2. Перевірити пристрій антивірусом</span>
							<span class="block">3. Відключити всі російські сервіси та додатки</span>
							<span class="block">4. Перевстановити Вашу ОС</span>
						</p>
					</div>
				</div>
			</div>

			<div class="rounded-lg bg-black p-5">
				<p class="text-base leading-7 font-bold text-white dark:text-white">
					ПОПЕРЕДЖЕННЯ СБУ: Використання російського програмного забезпечення громадянами України,
					особливо державними службовцями, військовими та працівниками критичної інфраструктури,
					може кваліфікуватися як сприяння ворожій розвідувальній діяльності.
				</p>
			</div>

			<div class="mt-8">
				<h3 class="mb-5 text-center text-xl font-semibold tracking-[0.5%]">
					НЕГАЙНО ВИДАЛІТЬ ШПИГУНСЬКЕ ПЗ ТА ВСТАНОВІТЬ БЕЗПЕЧНИЙ БРАУЗЕР:
				</h3>
				<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
					<a
						href="https://www.mozilla.org/uk/firefox/new/"
						class="dark:bg-fiord-900 dark:border-fiord-800 flex flex-col items-center rounded-lg
							border border-gray-100 p-4 shadow transition-all hover:-translate-y-1 hover:shadow-lg"
					>
						<div class="mb-3 text-4xl">🦊</div>
						<p class="text-center text-sm leading-[14px] font-semibold dark:text-white">
							Mozilla Firefox
						</p>
					</a>
					<a
						href="https://www.google.com/intl/uk/chrome/"
						class="dark:bg-fiord-900 dark:border-fiord-800 flex flex-col items-center rounded-lg
							border border-gray-100 p-4 shadow transition-all hover:-translate-y-1 hover:shadow-lg"
					>
						<div class="mb-3 text-4xl">🌐</div>
						<p class="text-center text-sm leading-[14px] font-semibold dark:text-white">
							Google Chrome
						</p>
					</a>
					<a
						href="https://brave.com/download/"
						class="dark:bg-fiord-900 dark:border-fiord-800 flex flex-col items-center rounded-lg
							border border-gray-100 p-4 shadow transition-all hover:-translate-y-1 hover:shadow-lg"
					>
						<div class="mb-3 text-4xl">🛡️</div>
						<p class="text-center text-sm leading-[14px] font-semibold dark:text-white">
							Brave Browser
						</p>
					</a>
					<a
						href="https://www.opera.com/uk"
						class="dark:bg-fiord-900 dark:border-fiord-800 flex flex-col items-center rounded-lg
							border border-gray-100 p-4 shadow transition-all hover:-translate-y-1 hover:shadow-lg"
					>
						<div class="mb-3 text-4xl">🔴</div>
						<p class="text-center text-sm leading-[14px] font-semibold dark:text-white">Opera</p>
					</a>
				</div>
			</div>
		</div>
	</div>
</template>

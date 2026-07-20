import { toValue } from "vue"
import type { MaybeRefOrGetter } from "vue"

interface UseSeoOptions {
	title: MaybeRefOrGetter<string>
	description?: MaybeRefOrGetter<string>
	noindex?: boolean
	canonical?: MaybeRefOrGetter<string>
	ogImage?: {
		title?: MaybeRefOrGetter<string>
		description?: MaybeRefOrGetter<string>
		headline?: string
	}
}

export function useSeo(opts: UseSeoOptions) {
	const route = useRoute()

	const title = computed(() => toValue(opts.title))
	const description = computed(() =>
		opts.description ? toValue(opts.description) : SEO_DEFAULT_DESCRIPTION
	)
	const canonical = computed(() =>
		opts.canonical ? toValue(opts.canonical) : `${SEO_SITE_URL}${route.path}`
	)

	useSeoMeta({
		title,
		ogTitle: title,
		description,
		ogDescription: description,
		twitterTitle: title,
		twitterDescription: description,
		...(opts.noindex ? { robots: "noindex, nofollow" } : {}),
	})

	useHead({
		link: [{ rel: "canonical", href: canonical }],
	})

	defineOgImage("Mindenit", {
		title: computed(() => toValue(opts.ogImage?.title ?? opts.title)),
		description: computed(() =>
			opts.ogImage?.description
				? toValue(opts.ogImage.description)
				: opts.description
					? toValue(opts.description)
					: SEO_DEFAULT_DESCRIPTION
		),
		headline: opts.ogImage?.headline ?? SEO_SITE_SHORT_NAME,
	})
}

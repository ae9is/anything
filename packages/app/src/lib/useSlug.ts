import logger from 'logger'
import { useRouter } from 'next/router'

// Convenience hook to get url slug as string. If multiple slugs, just returns the last.
export function useSlug() {
  const router = useRouter()
  const stringOrArray = router?.query?.id ?? router?.query?.slug
  const slug = typeof stringOrArray === 'string' ? stringOrArray : stringOrArray?.at(-1)
  logger.debug('Url slug: ', slug)
  return slug
}

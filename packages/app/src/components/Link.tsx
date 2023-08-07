import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { join } from '../lib/style'

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> &
  NextLinkProps & {
    children?: React.ReactNode
    noUnderline?: boolean
    noActive?: boolean
  } & React.RefAttributes<HTMLAnchorElement>

// ref: https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating
export function Link(props: LinkProps) {
  const { noUnderline = false, noActive = false, className, children, href, ...rest } = props

  const pathname = usePathname()
  const isActive = pathname.includes(href.toString()) && !noActive

  const defaultClasses = isActive ? 'text-primary' : 'text-base-content'
  const underlineHighlight = 'underline-offset-4 underline decoration-1 hover:decoration-2 decoration-primary ' +
    'hover:decoration-primary-focus'
  const colorHighlight = isActive ? 'hover:text-primary-focus' : 'hover:text-primary'
  const styleSpecificClasses = noUnderline ? colorHighlight : underlineHighlight

  return (
    <NextLink
      className={join(defaultClasses, styleSpecificClasses, className)}
      href={href}
      {...rest}
    >
      {children}
    </NextLink>
  )
}

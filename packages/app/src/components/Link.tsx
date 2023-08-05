import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { join } from '../lib/style'

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> &
  NextLinkProps & {
    children?: React.ReactNode
  } & React.RefAttributes<HTMLAnchorElement>

export function Link(props: LinkProps) {
  const { className, children, ...rest } = props

  return (
    <NextLink
      className={join('text-base-content hover:text-base-content focus:text-base-content', className)}
      {...rest}
    >
      {children}
    </NextLink>
  )
}

import { join } from "../lib/style"

export const NewTabLink = ({
  children,
  href,
  className,
  ...other
}: {
  children: React.ReactNode
  href: string
  className?: string
}) => {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      href={href}
      {...other}
      className={join(
        'text-base-content hover:text-base-content focus:text-base-content no-underline border-b hover:border-b-2 border-primary',
        className
      )}
    >
      {children}
    </a>
  )
}

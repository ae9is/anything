import { useContext, useRef } from 'react'
import { UserAttrContext } from '../app/(auth)/provider'
import { Link } from './Link'
import { Avatar } from './Avatar'
import { signOut } from '../lib/auth'
import { ThemeChanger } from './theme/ThemeChanger'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const userAttr = useContext(UserAttrContext)
  const navModal = useRef<HTMLDialogElement>(null)

  const pathname = usePathname()
  const links = [
    //
    'View',
    'Import',
    'Healthz',
    'Test'
  ]
  function navbarLinks(modal?: boolean) {
    return (
      <>
        {links?.map((name, idx) => {
          const href = `/${name.toLowerCase()}`
          const isActive = pathname.includes(href.toString())
          const className = modal
            ? 'block -ml-px pl-4 border-l ' +
              (isActive
                ? 'border-primary hover:border-primary-focus'
                // text-neutral is just too dark to use, so hardcode text-gray-500 and ignore theming
                : 'hover:!text-base-content text-gray-500 border-transparent hover:border-base-content')
            : 'font-semibold pr-2 ml-8'
          return (
            <li key={name + idx}>
              <Link onClick={closeModal} noUnderline href={href} className={className}>
                {name}
              </Link>
            </li>
          )
        })}
      </>
    )
  }

  function showModal() {
    navModal?.current?.showModal()
  }

  function closeModal() {
    navModal?.current?.close()
  }

  const homeLink = (
    <Link onClick={closeModal} noActive noUnderline href="/" className="font-semibold text-xl !text-base-content">
      anything
    </Link>
  )

  async function handleSignOut() {
    await signOut()
  }

  return (
    <nav className="flex-no-wrap relative flex w-full items-center justify-between bg-base-100 py-2 shadow-md shadow-black/5 lg:flex-wrap lg:justify-start">
      <div className="flex w-full flex-wrap items-center justify-between px-3">
        <div className="lg:hidden">
          <button
            className="block border-0 bg-transparent px-2 hover:no-underline hover:shadow-none focus:no-underline focus:shadow-none focus:outline-none focus:ring-0"
            type="button"
            onClick={showModal}
          >
            <div className="flex flex-row items-center">
              <span className="[&>svg]:w-7">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 9h16.5m-16.5 6.75h16.5"
                  />
                </svg>
              </span>
              <div className="mx-4 font-semibold text-xl">anything</div>
            </div>
          </button>
          <dialog ref={navModal} id="navModal" className="modal justify-items-start items-stretch ">
            <form method="dialog" className="modal-box max-h-full rounded-none w-fit">
              <div className="mb-8">
                {homeLink}
              </div>
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
              <ul tabIndex={0} className="z-[1] w-52 border-l border-gray-500 space-y-6">
                {navbarLinks(true)}
              </ul>
            </form>
            <form method="dialog" className="modal-backdrop">
              <button>Close</button>
            </form>
          </dialog>
        </div>

        <div className="!visible hidden flex-grow basis-[100%] items-center lg:!flex md:basis-auto">
          <div className="ml-2">
            {homeLink}
          </div>
          <ul className="list-style-none mr-auto flex flex-col pl-0 lg:flex-row">
            {navbarLinks()}
          </ul>
        </div>

        <div className="flex items-center">
          <ThemeChanger />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="m-1">
              <Avatar />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-52"
            >
              <li className="disabled !cursor-text !pointer-events-none">
                <p>Logged in as {userAttr?.displayName || 'Guest'}</p>
              </li>
              <li>
                <Link noUnderline onClick={handleSignOut} href="/">
                  Sign out
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}

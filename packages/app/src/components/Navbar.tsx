import { useContext, useRef } from 'react'
import { UserAttrContext } from '../app/(auth)/provider'
import { Link } from './Link'
import { Avatar } from './Avatar'
import { signOut } from '../lib/auth'
import { ThemeChanger } from './theme/ThemeChanger'

export function Navbar() {
  const userAttr = useContext(UserAttrContext)
  const navModal = useRef<HTMLDialogElement>(null)

  const links = [
    //
    'View',
    'Import'
  ]
  const navbarLinksUi = (
    <>
      {links?.map((name, idx) => {
        const href = `/${name.toLowerCase()}`

        return (
          <li key={name + idx} className="mb-4 lg:mb-0 lg:pr-2 lg:ml-8">
            <Link href={href}><button>{name}</button></Link>
          </li>
        )
      })}
    </>
  )

  function showModal() {
    navModal?.current?.showModal()
  }

  const appIcon = (
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
        d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
      />
    </svg>
  )

  return (
    <nav className="flex-no-wrap relative flex w-full items-center justify-between bg-base-100 py-2 shadow-md shadow-black/5 lg:flex-wrap lg:justify-start">
      <div className="flex w-full flex-wrap items-center justify-between px-3">
        <div className="">
          <button
            className="block border-0 bg-transparent px-2 hover:no-underline hover:shadow-none focus:no-underline focus:shadow-none focus:outline-none focus:ring-0 lg:hidden"
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
        </div>
        {/*
          TODO FIXME
          Clicking any button will close the modal.
          Except if a modal link to the current page is clicked, then nothing will happen.
          Sometimes the modal will not close regardless when a link is clicked.
        */}
        <dialog ref={navModal} id="navModal" className="modal justify-items-start items-stretch ">
          <form method="dialog" className="modal-box max-h-full rounded-none w-fit">
            <div className="pb-4">
                <Link href="/" className="font-semibold text-xl">
                  <button>
                    anything
                  </button>
                </Link>
            </div>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <ul tabIndex={0} className="z-[1] menu p-1 w-52">
              {navbarLinksUi}
            </ul>
          </form>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>

        <div className="!visible hidden flex-grow basis-[100%] items-center lg:!flex md:basis-auto">
          <Link href="/" className="font-semibold text-xl ml-2">
            anything
          </Link>
          {/*
          <Link className="mb-4 mr-2 mt-3 flex items-center lg:mb-0 lg:mt-0" href="/">
            {appIcon}
          </Link>
          */}
          <ul className="list-style-none mr-auto flex flex-col pl-0 lg:flex-row">
            {navbarLinksUi}
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
                <Link onClick={signOut} href="/">
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

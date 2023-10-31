import { Footer, Navbar } from '..'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-none">
        <Navbar />
      </div>
      <div className="flex-auto prose max-w-full container p-12">{children}</div>
      <div className="flex-none bg-base-300">
        <Footer />
      </div>
    </div>
  )
}

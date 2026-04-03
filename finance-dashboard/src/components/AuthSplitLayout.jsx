export function AuthSplitLayout({ title, mobileSubtitle, desktopSubtitle, children }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-12 text-white lg:flex">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur">
            F
          </div>
          <h1 className="mt-10 max-w-md text-4xl font-bold leading-tight tracking-tight">
            Clarity for every rupee you move.
          </h1>
          <p className="mt-4 max-w-sm text-indigo-100">
            Role-based access, live summaries, and trends—wired to your finance API.
          </p>
        </div>
        <p className="text-sm text-indigo-200/80">Finance Dashboard · React + Tailwind</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              F
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-slate-600">{mobileSubtitle}</p>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-slate-600">{desktopSubtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export const authInputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none ring-indigo-500/20 transition focus:border-indigo-500 focus:ring-4'

import { useState } from 'react';

interface SidebarProps {
  role: string;
  userName: string;
  currentPath: string;
}

const links: Record<string, { href: string; label: string }[]> = {
  Cartera: [
    { href: '/cartera/solicitudes', label: 'Solicitudes' },
  ],
  Admin: [
    { href: '/cartera/solicitudes', label: 'Solicitudes' },
    { href: '/admin/users', label: 'Usuarios' },
  ],
};

export default function Sidebar({ role, userName, currentPath }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const items = links[role] ?? links.Cartera;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-3 top-3 z-30 rounded-lg bg-white p-2 shadow-md dark:bg-gray-800 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <button
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-gray-900 text-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-700">
          <span className="text-lg font-bold tracking-tight">CarteraCobro</span>
        </div>

        <div className="flex items-center gap-3 border-b border-gray-700 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-400">{role}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                currentPath === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

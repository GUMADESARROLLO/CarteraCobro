import { useState, useEffect, useCallback } from 'react';

interface SidebarProps {
  role: string;
  userName: string;
  currentPath: string;
}

const links: Record<string, { href: string; label: string }[]> = {
  Cartera: [
    { href: '/cartera/solicitudes', label: 'Solicitudes' },
    { href: '/cartera/recibos', label: 'Recibos' },
  ],
  Admin: [
    { href: '/cartera/solicitudes', label: 'Solicitudes' },
    { href: '/cartera/recibos', label: 'Recibos' },
    { href: '/admin/users', label: 'Usuarios' },
  ],
};

export default function Sidebar({ role, userName, currentPath }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      document.documentElement.dataset.sidebarCollapsed = next ? 'true' : 'false';
      return next;
    });
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (collapsed) el.dataset.sidebarCollapsed = 'true';
    else delete el.dataset.sidebarCollapsed;
  }, [collapsed]);

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
        className={`fixed inset-y-0 left-0 z-20 flex flex-col bg-gray-900 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-700 px-3">
          {collapsed ? (
            <span className="text-lg font-bold tracking-tight">CC</span>
          ) : (
            <span className="text-lg font-bold tracking-tight">CarteraCobro</span>
          )}
          <button
            onClick={toggleCollapsed}
            className="absolute right-2 top-4 hidden rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white lg:block"
            aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <svg className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className={`flex items-center gap-3 border-b border-gray-700 px-3 py-4 ${collapsed ? 'justify-center' : 'px-6'}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{role}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                currentPath === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {collapsed ? (
                <span className="text-lg font-bold">{item.label.charAt(0)}</span>
              ) : (
                item.label
              )}
            </a>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-3">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-red-600 hover:text-white ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Cerrar sesion' : undefined}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && 'Cerrar sesion'}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

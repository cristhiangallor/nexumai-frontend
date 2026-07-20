import { Outlet } from 'react-router'

export function ConsoleLayout() {
  return (
    <div>
      <header
        style={{
          background: 'var(--sidebar)',
          color: 'var(--sidebar-foreground)',
          padding: '16px',
        }}
      >
        Consola (RRHH)
      </header>
      <Outlet />
    </div>
  )
}

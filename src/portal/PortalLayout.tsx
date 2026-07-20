import { Outlet } from 'react-router'

export function PortalLayout() {
  return (
    <div>
      <header
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          padding: '16px',
        }}
      >
        Portal del colaborador
      </header>
      <Outlet />
    </div>
  )
}

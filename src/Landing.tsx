import { Link } from 'react-router'

// TODO: reemplazar por enrutamiento por rol cuando exista auth (NEX-12); la
// superficie de entrada depende de la decisión de acceso del colaborador (§12
// MVP). Este landing es andamiaje provisional, no una decisión de diseño.
export function Landing() {
  return (
    <div style={{ padding: '16px' }}>
      <h1>Nexum Compliance</h1>
      <nav>
        <ul>
          <li>
            <Link to="/console">Consola (RRHH)</Link>
          </li>
          <li>
            <Link to="/portal">Portal del colaborador</Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

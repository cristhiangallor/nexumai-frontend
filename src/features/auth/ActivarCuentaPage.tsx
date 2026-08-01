import { useNavigate, useParams, useSearchParams } from 'react-router'

import { PARAM_TOKEN_PASSWORD, rutaLogin } from '@/rutas'

import {
  FormularioEstablecerPassword,
  type TextosEstablecerPassword,
} from './FormularioEstablecerPassword'

/**
 * Copy del flujo de ACTIVACIÓN (NEX-69). Diverge del de recuperación en el `422`: un
 * invitado NO puede auto-reenviarse la invitación, así que el mensaje remite al
 * administrador y NO se ofrece acción de auto-reenvío (por eso la página omite
 * `accionEnlaceInvalido`).
 */
const TEXTOS_ACTIVACION: TextosEstablecerPassword = {
  titulo: 'Activa tu cuenta',
  descripcion:
    'Crea una contraseña de al menos 12 caracteres para activar tu cuenta.',
  etiquetaBoton: 'Activar cuenta',
  etiquetaBotonEnviando: 'Activando…',
  mensajeEnlaceInvalido:
    'Este enlace de activación ya no es válido. Pide a tu administrador que te reenvíe la invitación.',
}

/**
 * Pantalla pública tenant-scoped (`/:slug/activar?token=...`) que cierra el flujo de
 * invitación (NEX-47): lo que hace el invitado al abrir el enlace del correo. REUTILIZA
 * el formulario y el hook de F-010; solo aporta el copy de activación, la navegación y el
 * matiz del 422. Tras el `204` navega a login (SIN auto-login: el contrato no devuelve
 * token de sesión) con una clave de aviso PROPIA (`avisoCuentaActivada`).
 */
export function ActivarCuentaPage() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(PARAM_TOKEN_PASSWORD)
  const navigate = useNavigate()

  return (
    <FormularioEstablecerPassword
      slug={slug}
      token={token}
      textos={TEXTOS_ACTIVACION}
      onExito={() =>
        navigate(rutaLogin(slug), {
          replace: true,
          state: { avisoCuentaActivada: true },
        })
      }
      // Sin `accionEnlaceInvalido`: el invitado no puede auto-reenviarse la invitación.
    />
  )
}

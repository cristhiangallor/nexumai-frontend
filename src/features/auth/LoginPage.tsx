import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/core/http'
import { setSlug } from '@/core/session'

import { useLogin } from './useLogin'

// TODO(NEX-51/dashboard): destino autenticado provisional. Reemplazar por
// enrutamiento por rol/superficie cuando exista el dashboard; ver la landing
// provisional de "/" en F-001. Aquí NO se decide consola-vs-portal por permisos.
const DESTINO_TRAS_LOGIN = '/inicio'

// Validación de EXPERIENCIA (formato de correo), no de seguridad: solo da feedback
// temprano. El backend es el único que valida de verdad.
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Mensaje de error mostrado al usuario. Un `401` es indistinguible a propósito
 * (anti-enumeración): un único mensaje genérico para los cuatro motivos posibles;
 * no revela si el correo/tenant existe ni si la cuenta está inactiva.
 */
function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Correo o contraseña incorrectos'
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

interface ErroresCampo {
  email?: string
  password?: string
}

export function LoginPage() {
  // El `slug` (tenant) viene de la ruta, no de un campo (decisión de UX). No se
  // valida por adelantado (decisión A): si no existe, el login falla con el mismo
  // 401 genérico que cualquier credencial inválida.
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()

  // Aviso NO bloqueante tras un cierre de sesión que no pudo confirmarse con el
  // servidor (NEX-44): la pantalla lo recibe por `location.state`.
  const avisoCierreSesion = Boolean(
    (location.state as { avisoCierreSesion?: boolean } | null)
      ?.avisoCierreSesion,
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState<ErroresCampo>({})

  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  function validar(): boolean {
    const nuevos: ErroresCampo = {}
    if (!email.trim()) {
      nuevos.email = 'El correo es obligatorio'
    } else if (!FORMATO_CORREO.test(email)) {
      nuevos.email = 'Ingresa un correo válido'
    }
    if (!password) {
      nuevos.password = 'La contraseña es obligatoria'
    }
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validar()) {
      return
    }
    login.mutate(
      { slug, email, password },
      {
        onSuccess: () => {
          // Persistir el slug del tenant para el cierre de sesión (NEX-44).
          setSlug(slug)
          navigate(DESTINO_TRAS_LOGIN, { replace: true })
        },
      },
    )
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-left shadow">
        <h1 className="m-0 mb-6 text-2xl font-medium tracking-normal text-foreground">
          Iniciar sesión
        </h1>

        {avisoCierreSesion && (
          <p
            role="status"
            className="mb-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-text"
          >
            Cerramos tu sesión en este dispositivo, pero no pudimos confirmarlo
            con el servidor.
          </p>
        )}
        {login.isError && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text"
          >
            {mensajeDeError(login.error)}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Correo
            </label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              aria-invalid={errores.email ? true : undefined}
              aria-describedby={errores.email ? 'email-error' : undefined}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
            />
            {errores.email && (
              <p id="email-error" className="mt-1 text-sm text-danger-text">
                {errores.email}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              aria-invalid={errores.password ? true : undefined}
              aria-describedby={errores.password ? 'password-error' : undefined}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
            />
            {errores.password && (
              <p id="password-error" className="mt-1 text-sm text-danger-text">
                {errores.password}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={login.isPending}
            className="w-full"
          >
            {login.isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>
    </main>
  )
}

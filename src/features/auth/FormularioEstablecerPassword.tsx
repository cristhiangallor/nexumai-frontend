import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/core/http'

import { LONGITUD_MINIMA_PASSWORD } from './politicaPassword'
import { useEstablecerPassword } from './useEstablecerPassword'

/**
 * Copy que cambia entre flujos que comparten este formulario: recuperación (NEX-45) y
 * activación de invitado (NEX-69). El mensaje de éxito NO va aquí: el éxito navega al
 * login y es LoginPage quien muestra el aviso, con una clave de `location.state` propia
 * de cada flujo (no se mezclan significados en la misma clave).
 */
export interface TextosEstablecerPassword {
  titulo: string
  descripcion: string
  etiquetaBoton: string
  etiquetaBotonEnviando: string
  /**
   * Mensaje del `422` (token inválido/expirado/usado). DIVERGE por flujo: recuperación
   * invita a pedir otro enlace uno mismo; activación remite al administrador (el invitado
   * no puede auto-reenviarse la invitación). Por eso el 422 se parametriza aquí.
   */
  mensajeEnlaceInvalido: string
}

/** Acción opcional junto al mensaje de `422` (p. ej. "Solicitar un enlace nuevo"). */
interface AccionEnlaceInvalido {
  etiqueta: string
  ruta: string
}

interface FormularioEstablecerPasswordProps {
  /** Tenant, leído de la ruta por la página. */
  slug: string
  /** Token del enlace (query param). `null` si falta: no se valida hasta enviar (422). */
  token: string | null
  /** Copy específico del flujo. */
  textos: TextosEstablecerPassword
  /** Navegación tras `204`. Cada flujo decide su destino y su aviso (clave de estado). */
  onExito: () => void
  /**
   * Acción a ofrecer en el `422` (opcional). Recuperación pasa "Solicitar un enlace
   * nuevo"; activación la OMITE (el invitado no puede auto-reenviarse: sin enlace).
   */
  accionEnlaceInvalido?: AccionEnlaceInvalido
}

const ID_AYUDA_LONGITUD = 'password-longitud'

/**
 * Traduce el error a un mensaje humano es-MX. El `400` de política usa mensaje PROPIO:
 * el cuerpo del backend no se pinta (podría no ser presentable). El `422` (token
 * inválido/expirado/ya usado) usa el mensaje que aporta el flujo (diverge por flujo).
 */
function mensajeDeError(error: unknown, mensajeEnlaceInvalido: string): string {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return mensajeEnlaceInvalido
    }
    if (error.status === 400) {
      return `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`
    }
  }
  return 'No se pudo actualizar la contraseña. Inténtalo de nuevo.'
}

/**
 * Formulario REUTILIZABLE de establecer contraseña, sobre `POST /password` (el mismo en
 * recuperación y activación). Feedback de longitud EN VIVO hacia los 12 caracteres —
 * SOLO longitud, sin checklist de composición (contradiría NEX-38). El botón se bloquea
 * bajo 12 (coincide con la política, única condición); por lo demás, el backend es la
 * autoridad.
 */
export function FormularioEstablecerPassword({
  slug,
  token,
  textos,
  onExito,
  accionEnlaceInvalido,
}: FormularioEstablecerPasswordProps) {
  const establecer = useEstablecerPassword()
  const [password, setPassword] = useState('')

  const passwordRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    passwordRef.current?.focus()
  }, [])

  const longitud = password.length
  const cumpleLongitud = longitud >= LONGITUD_MINIMA_PASSWORD
  const esTokenInvalido =
    establecer.error instanceof ApiError && establecer.error.status === 422

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    // Único bloqueo: la longitud mínima de la política. Sin trimming (los espacios
    // cuentan, NEX-38). El token puede ir vacío: su validez la decide el backend (422).
    if (!cumpleLongitud) {
      return
    }
    establecer.mutate(
      { slug, token: token ?? '', password },
      { onSuccess: onExito },
    )
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-left shadow">
        <h1 className="m-0 mb-2 text-2xl font-medium tracking-normal text-foreground">
          {textos.titulo}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {textos.descripcion}
        </p>

        {establecer.isError && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text"
          >
            <p>
              {mensajeDeError(establecer.error, textos.mensajeEnlaceInvalido)}
            </p>
            {esTokenInvalido && accionEnlaceInvalido && (
              <p className="mt-2">
                <Link
                  to={accionEnlaceInvalido.ruta}
                  className="font-medium underline"
                >
                  {accionEnlaceInvalido.etiqueta}
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Nueva contraseña
            </label>
            <input
              id="password"
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              autoComplete="new-password"
              aria-describedby={ID_AYUDA_LONGITUD}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
            />
            {/* Feedback de longitud EN VIVO, anunciado a lectores de pantalla. Solo
                longitud: nunca un checklist de composición. */}
            <p
              id={ID_AYUDA_LONGITUD}
              aria-live="polite"
              className={`mt-1 text-sm ${
                cumpleLongitud ? 'text-success-text' : 'text-muted-foreground'
              }`}
            >
              {longitud}/{LONGITUD_MINIMA_PASSWORD} caracteres
              {cumpleLongitud
                ? ' — longitud suficiente'
                : ` (mínimo ${LONGITUD_MINIMA_PASSWORD})`}
            </p>
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={establecer.isPending || !cumpleLongitud}
            className="mt-4 w-full"
          >
            {establecer.isPending
              ? textos.etiquetaBotonEnviando
              : textos.etiquetaBoton}
          </Button>
        </form>
      </div>
    </main>
  )
}

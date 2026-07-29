import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { rutaLogin } from '@/rutas'

import { useRecuperarPassword } from './useRecuperarPassword'

// Validación de EXPERIENCIA (formato de correo), no de seguridad: feedback temprano.
// El backend es el único que valida de verdad.
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Mensaje de confirmación UNIFORME. Se muestra igual exista o no la cuenta
 * (anti-enumeración): jamás se revela si el correo está registrado.
 */
const MENSAJE_CONFIRMACION =
  'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'

/**
 * Pantalla pública tenant-scoped (`/:slug/recuperar`) para solicitar el enlace de
 * recuperación. Reutiliza el patrón de LoginPage (F-002): tarjeta centrada, formulario
 * con label asociado, botón que se deshabilita mientras envía (sin doble disparo).
 */
export function RecuperarPasswordPage() {
  // El `slug` (tenant) viene de la ruta, no de un campo.
  const { slug = '' } = useParams()
  const recuperar = useRecuperarPassword()

  const [email, setEmail] = useState('')
  const [errorCampo, setErrorCampo] = useState<string>()

  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!email.trim()) {
      setErrorCampo('El correo es obligatorio')
      return
    }
    if (!FORMATO_CORREO.test(email)) {
      setErrorCampo('Ingresa un correo válido')
      return
    }
    setErrorCampo(undefined)
    recuperar.mutate({ slug, email })
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-left shadow">
        <h1 className="m-0 mb-6 text-2xl font-medium tracking-normal text-foreground">
          Recuperar contraseña
        </h1>

        {recuperar.isSuccess ? (
          // Confirmación uniforme: mismo mensaje pase lo que pase (202 siempre).
          <div>
            <p
              role="status"
              className="mb-4 rounded-md bg-info-soft px-3 py-2 text-sm text-info-text"
            >
              {MENSAJE_CONFIRMACION}
            </p>
            <p className="text-sm">
              <Link
                to={rutaLogin(slug)}
                className="text-primary hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu
              contraseña.
            </p>

            {recuperar.isError && (
              <p
                role="alert"
                className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text"
              >
                No se pudo enviar la solicitud. Inténtalo de nuevo.
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
                  onChange={(evento) => setEmail(evento.target.value)}
                  autoComplete="username"
                  aria-invalid={errorCampo ? true : undefined}
                  aria-describedby={errorCampo ? 'email-error' : undefined}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
                />
                {errorCampo && (
                  <p id="email-error" className="mt-1 text-sm text-danger-text">
                    {errorCampo}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={recuperar.isPending}
                className="w-full"
              >
                {recuperar.isPending ? 'Enviando…' : 'Enviar enlace'}
              </Button>
            </form>

            <p className="mt-4 text-sm">
              <Link
                to={rutaLogin(slug)}
                className="text-primary hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}

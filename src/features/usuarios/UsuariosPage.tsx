// Pantalla de listado de usuarios (NEX-46): primera pantalla real de la consola. SOLO
// LECTURA (invitar/cambiar rol/estado son NEX-47/48/49). Orquesta filtros + tabla/
// tarjetas + paginación, con estado en la URL, y cubre los cinco estados de UI.

import {
  EstadoError,
  EstadoVacio,
  SkeletonCard,
  SkeletonTabla,
} from '@/components/estados'
import type { UsuarioResumen } from '@/core/api'
import { ApiError } from '@/core/http'
import { AccesoDenegado } from '@/core/permissions'

import type { CampoOrden, Orden } from './consultaUsuarios'
import { hayFiltrosActivos, TAMANO_PAGINA } from './consultaUsuarios'
import { FiltrosUsuarios } from './FiltrosUsuarios'
import { PaginacionUsuarios } from './PaginacionUsuarios'
import { TablaUsuarios } from './TablaUsuarios'
import { TarjetasUsuarios } from './TarjetasUsuarios'
import { useConsultaUsuarios } from './useConsultaUsuarios'
import { useUsuarios } from './useUsuarios'

export function UsuariosPage() {
  const { consulta, setFiltro, ordenarPor, irAPagina, limpiarFiltros } =
    useConsultaUsuarios()
  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useUsuarios(consulta)

  // Estado "sin permiso": el guard de ruta (RutaProtegida usuario.ver) cubre el caso
  // normal ANTES de cualquier fetch; esto atrapa una revocación en caliente (403 del
  // servidor). Es AccesoDenegado, NO EstadoError: falta de permiso no es "algo se rompió".
  if (isError && error instanceof ApiError && error.status === 403) {
    return <AccesoDenegado />
  }

  return (
    <main className="p-6">
      <h1 className="m-0 mb-1 text-2xl font-medium tracking-normal text-foreground">
        Usuarios
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Personas con acceso a la consola de tu empresa.
      </p>

      <div className="mb-6">
        <FiltrosUsuarios consulta={consulta} onFiltrar={setFiltro} />
      </div>

      <div aria-busy={isPlaceholderData}>
        <Contenido
          isPending={isPending}
          isError={isError}
          usuarios={data?.usuarios ?? []}
          total={data?.total ?? null}
          pagina={consulta.pagina}
          orden={consulta.orden}
          conFiltros={hayFiltrosActivos(consulta)}
          onOrdenarPor={ordenarPor}
          onIrAPagina={irAPagina}
          onReintentar={() => refetch()}
          onLimpiarFiltros={limpiarFiltros}
        />
      </div>
    </main>
  )
}

interface ContenidoProps {
  isPending: boolean
  isError: boolean
  usuarios: UsuarioResumen[]
  total: number | null
  pagina: number
  orden: Orden
  conFiltros: boolean
  onOrdenarPor: (campo: CampoOrden) => void
  onIrAPagina: (pagina: number) => void
  onReintentar: () => void
  onLimpiarFiltros: () => void
}

/** Resuelve cuál de los estados de UI mostrar según la query. */
function Contenido({
  isPending,
  isError,
  usuarios,
  total,
  pagina,
  orden,
  conFiltros,
  onOrdenarPor,
  onIrAPagina,
  onReintentar,
  onLimpiarFiltros,
}: ContenidoProps) {
  // Carga inicial: skeleton con la FORMA de esta pantalla (tabla en escritorio,
  // tarjetas en móvil). En paginación no entra aquí (keepPreviousData mantiene datos).
  if (isPending) {
    return (
      <>
        <div className="hidden md:block">
          <SkeletonTabla columnas={5} />
        </div>
        <div className="space-y-3 md:hidden">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    )
  }

  // Error (no-403): algo se rompió → EstadoError con reintento.
  if (isError) {
    return (
      <EstadoError
        mensaje="No se pudo cargar la lista de usuarios. Inténtalo de nuevo."
        onReintentar={onReintentar}
      />
    )
  }

  // Sin filas: distinguir vacío GENUINO de "el filtro no encontró nada".
  if (usuarios.length === 0) {
    return conFiltros ? (
      <EstadoVacio
        variante="sin-resultados"
        descripcion="Ningún usuario coincide con los filtros. Prueba a ajustarlos o límpialos."
        accion={{ etiqueta: 'Limpiar filtros', onAccionar: onLimpiarFiltros }}
      />
    ) : (
      <EstadoVacio
        variante="vacio"
        titulo="Aún no hay usuarios"
        descripcion="Cuando se agregue a alguien a tu empresa, aparecerá en esta lista."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <TablaUsuarios
          usuarios={usuarios}
          orden={orden}
          onOrdenarPor={onOrdenarPor}
        />
      </div>
      <div className="md:hidden">
        <TarjetasUsuarios usuarios={usuarios} />
      </div>
      <PaginacionUsuarios
        pagina={pagina}
        total={total}
        tamano={TAMANO_PAGINA}
        cantidadEnPagina={usuarios.length}
        onIrAPagina={onIrAPagina}
      />
    </div>
  )
}

# Gating de permisos en UI — constitución del frontend
Fuente de verdad: NEX-9 (pageId 46137387) + matriz v0 en "Seguridad y permisos"
(pageId 40304664). Si algo aquí diverge de esas páginas, gana la página.

## Propósito y límite inviolable
Este archivo define cómo la UI decide QUÉ MOSTRAR según permisos. Regla que
nunca se rompe: el gating es EXPERIENCIA, no seguridad. Ocultar un botón no
protege el dato; el backend es el único que autoriza, fresco por request (ADR-006).
Ante la duda "¿lo bloqueo en UI para proteger?": no. La protección es del backend;
la UI solo mejora la experiencia.

## De dónde salen los permisos
- Tras autenticar, el backend entrega el conjunto de permisos efectivos del
  usuario en su tenant. Se guardan UNA vez en el módulo de sesión.
- Ningún componente recalcula ni deriva permisos: los lee del estado de sesión.
- La forma exacta del payload NO está fijada: depende del contrato de auth (NEX-12).
  Hasta que exista, trabaja contra un tipo/mock provisional acordado. NO inventes
  campos ni asumas la forma de la respuesta.

## Modelo permiso + alcance
- Un permiso es una CLAVE que combina módulo + acción + alcance. El alcance va
  DENTRO de la clave, no es un campo aparte.
  Ejemplos reales: `expediente.ver_propio` vs `expediente.ver_todos`.
- Acciones (matriz v0): ver, crear, editar, eliminar, aprobar, descargar.
- Alcances: propio / equipo / todos. Los módulos usuario, rol_permiso,
  configuración, auditoría y plantilla NO llevan alcance.
- La UI LEE la clave que envía el backend. No construye claves, no infiere
  alcance, no deduce permisos desde el rol.

## Regla de oro: gating por permiso, NUNCA por rol
- CORRECTO:   ¿tiene `documento.crear_todos`? → muestro el botón.
- INCORRECTO: ¿es del rol "RH"?               → muestro el botón.
- Motivo: preguntar por rol acopla la UI a la semilla de roles; si cambian los
  permisos de un rol, la UI queda mal. Preguntar por permiso sobrevive al cambio.

## Presentación: OCULTAR por defecto
- Sin permiso → la acción se OCULTA (no se muestra deshabilitada).
- Única excepción (deshabilitar): la acción SÍ corresponde al usuario pero está
  temporalmente no disponible por ESTADO, no por permiso. Se justifica en la
  historia. El default es ocultar.
- "Sin permisos" es un estado de UI de primera clase: si una vista entera no es
  accesible, muestra vacío informativo o redirige; nunca una página rota.

## Mecanismo (nombres DESCRIPTIVOS; la firma exacta se fija en implementación)
- Consulta central única: un hook (algo como `usePermiso(clave)`) que responde
  sí/no leyendo de la sesión. Es la ÚNICA vía. No repliques la lógica en componentes.
- Envoltura declarativa: un componente gate (algo como `<ConPermiso clave="...">`)
  que renderiza su hijo solo si el permiso existe. Patrón por defecto para botones,
  ítems de menú y secciones.
- Navegación/rutas: una sección aparece solo si el usuario tiene algún permiso del
  módulo. Ante URL directa sin permiso: redirige o vacío (el backend igual rechaza).

## Casos límite que DEBES respetar (trampas de la matriz v0)
1. Superadmin Nexum NO cruza tenants: opera dentro de un tenant. No ofrezcas en
   UI nada tipo "cambiar de tenant" para ese rol.
2. En `recibo`, "aprobar" significa "ACUSAR RECIBO". La etiqueta del botón debe
   decir "Acusar recibo", nunca "Aprobar". No confundir con aprobar una solicitud.
3. El alcance "equipo" del Aprobador es UN nivel de reporte directo
   (`jefe_directo_id`), no jerarquía multinivel. No muestres equipos de
   reportes-de-reportes.

## Qué NO hace este archivo
- No valida datos ni decide acceso a documentos (eso es security.md + backend).
- No cachea permisos fuera de la sesión.
- No sustituye la verificación del backend: si responde 403, la UI lo acata
  aunque "creyera" tener permiso.
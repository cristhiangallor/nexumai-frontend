# Seguridad del cliente — constitución del frontend

Fuente de verdad: ADR-007 (pageId 46333954); mecanismo de sesión en ADR-006 (44662785).
Si algo aquí diverge, gana la página.

## Modelo de sesión (decidido, no reabrir sin ADR)

- Transporte del token: header `Authorization: Bearer <token>` en cada request
  autenticado. NO cookie. Al no ir en cookie, NO hay manejo de CSRF para la auth.
- Almacenamiento: en el almacenamiento del navegador (persiste entre recargas).
  La API concreta de almacenamiento web se confirma al implementar; no fijarla de
  memoria.

## El trade-off, explícito

Token en header + persistido en el navegador ⇒ es accesible a JavaScript ⇒ un XSS
puede robarlo. Se aceptó A SABIENDAS, a cambio de eliminar CSRF y ganar
simplicidad/portabilidad, CON LA CONDICIÓN de mitigar XSS de forma estricta. Por eso
las reglas anti-XSS de abajo no son opcionales: son la condición de la decisión.

## Mitigaciones anti-XSS (obligatorias)

- No renderizar HTML sin sanitizar proveniente de datos; no inyectar contenido no
  confiable directo en el DOM.
- Auditar dependencias (superficie de XSS por terceros); mantener el árbol acotado.
- Evaluar una Content Security Policy (CSP) como capa extra (con backend/infra,
  pues afecta cabeceras del servidor que sirve la SPA).

## PII y datos sensibles (INE, CURP, RFC, NSS, salario, recibos)

- NUNCA volcar el token ni PII en logs de consola, en URLs ni en almacenamiento
  persistente innecesario.
- El token transporta identificadores, no PII (coherente con ADR-006).
- Documentos sensibles: descarga SOLO por los mecanismos que expone el backend
  (descarga por backend o URL firmada). Nunca URLs públicas permanentes. No cachear
  documentos sensibles del lado del cliente.

## Cierre de sesión

El frontend borra el token del almacenamiento al cerrar sesión, ADEMÁS de que el
backend invalida la sesión (jti). Ambos lados, no solo uno.

## Recordatorio de enforcement

El backend es el único punto de enforcement. Un token robado se limita por la
expiración de 8h y se corta invalidando la sesión en backend. La UI solo reacciona
(p. ej. a 401/403); nunca "protege" ocultando algo.

## Verificar al implementar

API de almacenamiento web y validación de `Authorization: Bearer` en Spring Security
sobre Spring Boot 4.1.0 no se dan por conocidas: confirmar contra doc oficial vigente.

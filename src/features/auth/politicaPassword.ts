// Política de contraseña (NEX-38, cerrada). Fuente única de la regla, reutilizable por
// recuperación (NEX-45) y activación de invitado (NEX-47).
//
// SOLO longitud mínima. SIN reglas de composición (nada de exigir mayúscula/dígito/
// símbolo) y SIN trimming (los espacios cuentan): una passphrase de solo minúsculas de
// 15 caracteres es VÁLIDA. El backend es la autoridad final; esto es validación de
// experiencia para dar feedback temprano.

/** Longitud mínima de contraseña. Única regla de la política. */
export const LONGITUD_MINIMA_PASSWORD = 12

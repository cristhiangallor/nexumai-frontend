import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Mapeo al manual de marca §14 (NEX-64) sobre el `buttonVariants` GENERADO por shadcn.
// Cambios respecto al original y por qué (tokens del manual):
//  - `default` (primario): hover pasa de `bg-primary/80` a `--primary-hover` (#4324E6);
//    se AÑADE `active:bg-primary-active` (#351BBF) — el active de color no existía; el
//    `active:translate-y-px` de la base se conserva (press sutil, no lo prohíbe el
//    manual). `font-semibold` (peso 600 del §14).
//  - `secondary`: se remapea al §14 (fondo blanco `bg-background`, texto morado
//    `text-primary`, borde 1px `--primary-border` #DDD6FE, `font-semibold`).
//  - El peso base sigue en `font-medium` (500) a propósito: §14 asigna 600 SOLO a
//    primario y secundario; ghost/link/icon (menú, toggles) no deben heredar 600.
//  - Radio ya es 12px (`rounded-lg` = `--radius`) y `focus-visible` ya es consistente
//    en la base: no se tocan. `--shadow-button` NO se aplica (no está en index.css ni
//    lo respalda un mockup): divergencia registrada, fuera de alcance.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary font-semibold text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'border-primary-border bg-background font-semibold text-primary hover:bg-primary-soft',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// Este archivo es código GENERADO por shadcn y NO se edita a mano salvo el mapeo al
// §14 de arriba: modificarlo crearía divergencia silenciosa al regenerar/actualizar el
// primitivo. `buttonVariants` es parte de la API de la librería, no código muerto. Por
// eso NO se quita el export ni se cambia la config de ESLint: se suprime localmente la
// regla react-refresh del repo, que marca exportar algo además del componente.
// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }

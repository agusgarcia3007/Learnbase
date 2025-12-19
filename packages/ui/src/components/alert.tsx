import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@learnbase/ui/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border text-sm grid has-[data-slot=alert-icon]:grid-cols-[auto_1fr_auto] grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 items-center",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        primary: "bg-primary/10 text-primary border-primary/20",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
      },
      appearance: {
        default: "",
        light: "",
      },
      size: {
        default: "px-4 py-3",
        sm: "px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      appearance: "default",
      size: "default",
    },
  }
)

function Alert({
  className,
  variant,
  appearance,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, appearance, size }), className)}
      {...props}
    />
  )
}

function AlertIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-icon"
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function AlertToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-toolbar"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertIcon, AlertTitle, AlertDescription, AlertToolbar }

import { cva } from 'class-variance-authority';

export const filterInputVariants = cva(
  [
    'transition shrink-0 outline-none text-foreground relative flex items-center',
    'has-[[data-slot=filters-input]:focus-visible]:ring-ring/30',
    'has-[[data-slot=filters-input]:focus-visible]:border-ring',
    'has-[[data-slot=filters-input]:focus-visible]:outline-none',
    'has-[[data-slot=filters-input]:focus-visible]:ring-[3px]',
    'has-[[data-slot=filters-input]:focus-visible]:z-1',
    'has-[[data-slot=filters-input]:[aria-invalid=true]]:border',
    'has-[[data-slot=filters-input]:[aria-invalid=true]]:border-solid',
    'has-[[data-slot=filters-input]:[aria-invalid=true]]:border-destructive/60',
    'has-[[data-slot=filters-input]:[aria-invalid=true]]:ring-destructive/10',
    'dark:has-[[data-slot=filters-input]:[aria-invalid=true]]:border-destructive',
    'dark:has-[[data-slot=filters-input]:[aria-invalid=true]]:ring-destructive/20',
  ],
  {
    variants: {
      variant: {
        solid: 'border-0 bg-secondary',
        outline: 'bg-background border border-border',
      },
      size: {
        lg: 'h-10 text-sm px-2.5 has-[[data-slot=filters-prefix]]:ps-0 has-[[data-slot=filters-suffix]]:pe-0',
        md: 'h-9 text-sm px-2 has-[[data-slot=filters-prefix]]:ps-0 has-[[data-slot=filters-suffix]]:pe-0',
        sm: 'h-8 text-xs px-1.5 has-[[data-slot=filters-prefix]]:ps-0 has-[[data-slot=filters-suffix]]:pe-0',
      },
      cursorPointer: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      cursorPointer: true,
    },
  },
);

export const filterRemoveButtonVariants = cva(
  ['inline-flex items-center shrink-0 justify-center transition shrink-0 text-muted-foreground hover:text-foreground'],
  {
    variants: {
      variant: {
        solid: 'bg-secondary',
        outline: 'border border-border border-s-0 hover:bg-secondary',
      },
      size: {
        lg: 'h-10 w-10 [&_svg:not([class*=size-])]:size-4',
        md: 'h-9 w-9 [&_svg:not([class*=size-])]:size-3.5',
        sm: 'h-8 w-8 [&_svg:not([class*=size-])]:size-3',
      },
      cursorPointer: {
        true: 'cursor-pointer',
        false: '',
      },
      radius: {
        md: 'rounded-e-md',
        full: 'rounded-e-full',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      radius: 'md',
      cursorPointer: true,
    },
  },
);

export const filterAddButtonVariants = cva(
  [
    'inline-flex items-center shrink-0 justify-center transition shrink-0 text-foreground shadow-xs shadow-black/5',
    '[&_svg:not([role=img]):not([class*=text-]):not([class*=opacity-])]:opacity-60',
  ],
  {
    variants: {
      variant: {
        solid: 'border border-input hover:bg-secondary/60',
        outline: 'border border-border hover:bg-secondary',
      },
      size: {
        lg: 'h-10 px-4 text-sm gap-1.5 [&_svg:not([class*=size-])]:size-4',
        md: 'h-9 px-3 gap-1.5 text-sm [&_svg:not([class*=size-])]:size-4',
        sm: 'h-8 px-2.5 gap-1.25 text-xs [&_svg:not([class*=size-])]:size-3.5',
      },
      radius: {
        md: 'rounded-md',
        full: 'rounded-full',
      },
      cursorPointer: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      cursorPointer: true,
    },
  },
);

export const filterOperatorVariants = cva(
  [
    'transition text-muted-foreground hover:text-foreground data-[state=open]:text-foreground shrink-0 flex items-center relative focus-visible:z-1',
  ],
  {
    variants: {
      variant: {
        solid: 'bg-secondary',
        outline:
          'bg-background border border-border border-e-0 hover:bg-secondary data-[state=open]:bg-secondary [&+[data-slot=filters-remove]]:border-s',
      },
      size: {
        lg: 'h-10 px-4 text-sm gap-1.5',
        md: 'h-9 px-3 text-sm gap-1.25',
        sm: 'h-8 px-2.5 text-xs gap-1',
      },
      cursorPointer: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      cursorPointer: true,
    },
  },
);

export const filterFieldLabelVariants = cva(
  [
    'flex gap-1.5 shrink-0 px-1.5 py-1 items-center text-foreground',
    '[&_svg:not([class*=size-])]:size-3.5 [&_svg:not([class*=opacity-])]:opacity-60',
  ],
  {
    variants: {
      variant: {
        solid: 'bg-secondary',
        outline: 'border border-border border-e-0',
      },
      size: {
        lg: 'h-10 px-4 text-sm gap-1.5 [&_svg:not([class*=size-])]:size-4',
        md: 'h-9 px-3 gap-1.5 text-sm [&_svg:not([class*=size-])]:size-4',
        sm: 'h-8 px-2.5 gap-1.25 text-xs [&_svg:not([class*=size-])]:size-3.5',
      },
      radius: {
        md: 'rounded-s-md',
        full: 'rounded-s-full',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  },
);

export const filterFieldValueVariants = cva(
  'text-foreground transition shrink-0 flex items-center gap-1 relative focus-visible:z-1',
  {
    variants: {
      variant: {
        solid: 'bg-secondary',
        outline: 'bg-background border border-border hover:bg-secondary has-[[data-slot=switch]]:hover:bg-transparent',
      },
      size: {
        lg: 'h-10 px-4 text-sm gap-1.5 [&_svg:not([class*=size-])]:size-4',
        md: 'h-9 px-3 gap-1.5 text-sm [&_svg:not([class*=size-])]:size-4',
        sm: 'h-8 px-2.5 gap-1.25 text-xs [&_svg:not([class*=size-])]:size-3.5',
      },
      cursorPointer: {
        true: 'cursor-pointer has-[[data-slot=switch]]:cursor-default',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      cursorPointer: true,
    },
  },
);

export const filterFieldAddonVariants = cva('text-foreground shrink-0 flex items-center justify-center', {
  variants: {
    variant: {
      solid: '',
      outline: '',
    },
    size: {
      lg: 'h-10 px-4 text-sm',
      md: 'h-9 px-3 text-sm',
      sm: 'h-8 px-2.5 text-xs',
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});

export const filterFieldBetweenVariants = cva('text-muted-foreground shrink-0 flex items-center', {
  variants: {
    variant: {
      solid: 'bg-secondary',
      outline: 'bg-background border border-border border-x-0',
    },
    size: {
      lg: 'h-10 px-4 text-sm',
      md: 'h-9 px-3 text-sm',
      sm: 'h-8 px-2.5 text-xs',
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});

export const filtersContainerVariants = cva('flex flex-wrap items-center', {
  variants: {
    variant: {
      solid: 'gap-2',
      outline: '',
    },
    size: {
      sm: 'gap-1.5',
      md: 'gap-2.5',
      lg: 'gap-3.5',
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});

export const filterItemVariants = cva('flex items-center shadow-xs shadow-black/5', {
  variants: {
    variant: {
      solid: 'gap-px',
      outline: '',
    },
  },
  defaultVariants: {
    variant: 'outline',
  },
});

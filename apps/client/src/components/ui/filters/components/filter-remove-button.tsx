'use client';

import type React from 'react';
import { X } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useFilterContext } from '../filter-context';
import { filterRemoveButtonVariants } from '../filter-variants';

interface FilterRemoveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof filterRemoveButtonVariants> {
  icon?: React.ReactNode;
}

export function FilterRemoveButton({ className, icon = <X />, ...props }: FilterRemoveButtonProps) {
  const context = useFilterContext();

  return (
    <button
      data-slot="filters-remove"
      className={cn(
        filterRemoveButtonVariants({
          variant: context.variant,
          size: context.size,
          cursorPointer: context.cursorPointer,
          radius: context.radius,
        }),
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}

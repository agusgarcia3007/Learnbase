'use client';

import { Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFilterContext } from '../filter-context';
import { filterOperatorVariants } from '../filter-variants';
import { getOperatorsForField } from '../filter-operators';
import type { FilterFieldConfig } from '../filter-types';

interface FilterOperatorDropdownProps<T = unknown> {
  field: FilterFieldConfig<T>;
  operator: string;
  values: T[];
  onChange: (operator: string) => void;
}

export function FilterOperatorDropdown<T = unknown>({
  field,
  operator,
  values,
  onChange,
}: FilterOperatorDropdownProps<T>) {
  const context = useFilterContext();
  const operators = getOperatorsForField(field, values, context.i18n);

  const operatorLabel =
    operators.find((op) => op.value === operator)?.label || context.i18n.helpers.formatOperator(operator);

  if (!operators.find((op) => op.value === operator)) {
    console.warn(
      `Operator "${operator}" not found in operators for field "${field.key}" (type: ${field.type}). Available operators:`,
      operators.map((op) => op.value),
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterOperatorVariants({ variant: context.variant, size: context.size })}>
        {operatorLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {operators.map((op) => (
          <DropdownMenuItem
            key={op.value}
            onClick={() => onChange(op.value)}
            className="flex items-center justify-between"
          >
            <span>{op.label}</span>
            <Check className={`text-primary ms-auto ${op.value === operator ? 'opacity-100' : 'opacity-0'}`} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

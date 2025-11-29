'use client';

import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useFilterContext } from './filter-context';
import { filtersContainerVariants, filterItemVariants, filterFieldLabelVariants } from './filter-variants';
import { getFieldsMap } from './filter-utils';
import { FilterOperatorDropdown } from './components/filter-operator-dropdown';
import { FilterValueSelector } from './components/filter-value-selector';
import { FilterRemoveButton } from './components/filter-remove-button';
import type { Filter, FilterFieldsConfig } from './filter-types';

interface FiltersContentProps<T = unknown> {
  filters: Filter<T>[];
  fields: FilterFieldsConfig<T>;
  onChange: (filters: Filter<T>[]) => void;
}

export function FiltersContent<T = unknown>({ filters, fields, onChange }: FiltersContentProps<T>) {
  const context = useFilterContext();
  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields]);

  const updateFilter = useCallback(
    (filterId: string, updates: Partial<Filter<T>>) => {
      onChange(
        filters.map((filter) => {
          if (filter.id === filterId) {
            const updatedFilter = { ...filter, ...updates };
            if (updates.operator === 'empty' || updates.operator === 'not_empty') {
              updatedFilter.values = [] as T[];
            }
            return updatedFilter;
          }
          return filter;
        }),
      );
    },
    [filters, onChange],
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      onChange(filters.filter((filter) => filter.id !== filterId));
    },
    [filters, onChange],
  );

  return (
    <div className={cn(filtersContainerVariants({ variant: context.variant, size: context.size }), context.className)}>
      {filters.map((filter) => {
        const field = fieldsMap[filter.field];
        if (!field) return null;

        return (
          <div key={filter.id} className={filterItemVariants({ variant: context.variant })} data-slot="filter-item">
            <div
              className={filterFieldLabelVariants({
                variant: context.variant,
                size: context.size,
                radius: context.radius,
              })}
            >
              {field.icon}
              {field.label}
            </div>

            <FilterOperatorDropdown<T>
              field={field}
              operator={filter.operator}
              values={filter.values}
              onChange={(operator) => updateFilter(filter.id, { operator })}
            />

            <FilterValueSelector<T>
              field={field}
              values={filter.values}
              onChange={(values) => updateFilter(filter.id, { values })}
              operator={filter.operator}
            />

            <FilterRemoveButton onClick={() => removeFilter(filter.id)} />
          </div>
        );
      })}
    </div>
  );
}

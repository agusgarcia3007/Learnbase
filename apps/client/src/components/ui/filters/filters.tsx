import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@learnbase/ui";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FilterOperatorDropdown } from "./components/filter-operator-dropdown";
import { FilterRemoveButton } from "./components/filter-remove-button";
import { FilterValueSelector } from "./components/filter-value-selector";
import { SelectOptionsPopover } from "./components/select-options-popover";
import { FilterContext } from "./filter-context";
import { DEFAULT_I18N } from "./filter-i18n";
import type {
  Filter,
  FilterFieldConfig,
  FilterFieldsConfig,
  FilterI18nConfig,
} from "./filter-types";
import {
  createFilter,
  flattenFields,
  getFieldsMap,
  isFieldGroup,
  isGroupLevelField,
} from "./filter-utils";
import {
  filterAddButtonVariants,
  filterFieldLabelVariants,
  filterItemVariants,
  filtersContainerVariants,
} from "./filter-variants";

interface FiltersProps<T = unknown> {
  filters: Filter<T>[];
  fields: FilterFieldsConfig<T>;
  onChange: (filters: Filter<T>[]) => void;
  className?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  addButtonIcon?: React.ReactNode;
  addButtonClassName?: string;
  addButton?: React.ReactNode;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  radius?: "md" | "full";
  i18n?: Partial<FilterI18nConfig>;
  showSearchInput?: boolean;
  cursorPointer?: boolean;
  trigger?: React.ReactNode;
  allowMultiple?: boolean;
  popoverContentClassName?: string;
}

export function Filters<T = unknown>({
  filters,
  fields,
  onChange,
  className,
  showAddButton = true,
  addButtonText,
  addButtonIcon,
  addButtonClassName,
  addButton,
  variant = "outline",
  size = "md",
  radius = "md",
  i18n,
  showSearchInput = true,
  cursorPointer = true,
  trigger,
  allowMultiple = true,
  popoverContentClassName,
}: FiltersProps<T>) {
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [selectedFieldForOptions, setSelectedFieldForOptions] =
    useState<FilterFieldConfig<T> | null>(null);
  const [tempSelectedValues, setTempSelectedValues] = useState<unknown[]>([]);

  const mergedI18n: FilterI18nConfig = {
    ...DEFAULT_I18N,
    ...i18n,
    operators: {
      ...DEFAULT_I18N.operators,
      ...i18n?.operators,
    },
    placeholders: {
      ...DEFAULT_I18N.placeholders,
      ...i18n?.placeholders,
    },
    validation: {
      ...DEFAULT_I18N.validation,
      ...i18n?.validation,
    },
  };

  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields]);

  const updateFilter = useCallback(
    (filterId: string, updates: Partial<Filter<T>>) => {
      onChange(
        filters.map((filter) => {
          if (filter.id === filterId) {
            const updatedFilter = { ...filter, ...updates };
            if (
              updates.operator === "empty" ||
              updates.operator === "not_empty"
            ) {
              updatedFilter.values = [] as T[];
            }
            return updatedFilter;
          }
          return filter;
        })
      );
    },
    [filters, onChange]
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      onChange(filters.filter((filter) => filter.id !== filterId));
    },
    [filters, onChange]
  );

  const addFilterHandler = useCallback(
    (fieldKey: string) => {
      const field = fieldsMap[fieldKey];
      if (field && field.key) {
        if (field.type === "select" || field.type === "multiselect") {
          setSelectedFieldForOptions(field);
          const existingFilter = filters.find((f) => f.field === fieldKey);
          const initialValues =
            field.type === "multiselect" && existingFilter
              ? existingFilter.values
              : [];
          setTempSelectedValues(initialValues);
          return;
        }

        const defaultOperator =
          field.defaultOperator ||
          (field.type === "daterange"
            ? "between"
            : field.type === "numberrange"
            ? "between"
            : field.type === "boolean"
            ? "is"
            : "is");
        let defaultValues: unknown[] = [];

        if (
          [
            "text",
            "number",
            "date",
            "email",
            "url",
            "tel",
            "time",
            "datetime",
          ].includes(field.type || "")
        ) {
          defaultValues = [""] as unknown[];
        } else if (field.type === "daterange") {
          defaultValues = ["", ""] as unknown[];
        } else if (field.type === "numberrange") {
          defaultValues = [field.min || 0, field.max || 100] as unknown[];
        } else if (field.type === "boolean") {
          defaultValues = [false] as unknown[];
        } else if (field.type === "time") {
          defaultValues = [""] as unknown[];
        } else if (field.type === "datetime") {
          defaultValues = [""] as unknown[];
        }

        const newFilter = createFilter<T>(
          fieldKey,
          defaultOperator,
          defaultValues as T[]
        );
        const newFilters = [...filters, newFilter];
        onChange(newFilters);
        setAddFilterOpen(false);
      }
    },
    [fieldsMap, filters, onChange]
  );

  const addFilterWithOption = useCallback(
    (
      field: FilterFieldConfig<T>,
      values: unknown[],
      closePopover: boolean = true
    ) => {
      if (!field.key) return;

      const defaultOperator = field.defaultOperator || "is";
      const existingFilterIndex = filters.findIndex(
        (f) => f.field === field.key
      );

      if (existingFilterIndex >= 0) {
        const updatedFilters = [...filters];
        updatedFilters[existingFilterIndex] = {
          ...updatedFilters[existingFilterIndex],
          values: values as T[],
        };
        onChange(updatedFilters);
      } else {
        const newFilter = createFilter<T>(
          field.key,
          defaultOperator,
          values as T[]
        );
        const newFilters = [...filters, newFilter];
        onChange(newFilters);
      }

      if (closePopover) {
        setAddFilterOpen(false);
        setSelectedFieldForOptions(null);
        setTempSelectedValues([]);
      } else {
        setTempSelectedValues(values as unknown[]);
      }
    },
    [filters, onChange]
  );

  const selectableFields = useMemo(() => {
    const flatFields = flattenFields(fields);
    return flatFields.filter((field) => {
      if (!field.key || field.type === "separator") {
        return false;
      }
      if (allowMultiple) {
        return true;
      }
      return !filters.some((filter) => filter.field === field.key);
    });
  }, [fields, filters, allowMultiple]);

  return (
    <FilterContext.Provider
      value={{
        variant,
        size,
        radius,
        i18n: mergedI18n,
        cursorPointer,
        className,
        showAddButton,
        addButtonText,
        addButtonIcon,
        addButtonClassName,
        addButton,
        showSearchInput,
        trigger,
        allowMultiple,
      }}
    >
      <div
        className={cn(filtersContainerVariants({ variant, size }), className)}
      >
        {showAddButton && selectableFields.length > 0 && (
          <Popover
            open={addFilterOpen}
            onOpenChange={(open) => {
              setAddFilterOpen(open);
              if (!open) {
                setSelectedFieldForOptions(null);
                setTempSelectedValues([]);
              }
            }}
          >
            <PopoverTrigger asChild>
              {addButton ? (
                addButton
              ) : (
                <button
                  className={cn(
                    filterAddButtonVariants({
                      variant: variant,
                      size: size,
                      cursorPointer: cursorPointer,
                      radius: radius,
                    }),
                    addButtonClassName
                  )}
                  title={mergedI18n.addFilterTitle}
                >
                  {addButtonIcon || <Plus />}
                  {addButtonText || mergedI18n.addFilter}
                </button>
              )}
            </PopoverTrigger>
            <PopoverContent
              className={cn("w-[200px] p-0", popoverContentClassName)}
              align="start"
            >
              <Command>
                {selectedFieldForOptions ? (
                  <SelectOptionsPopover<T>
                    field={selectedFieldForOptions}
                    values={tempSelectedValues as T[]}
                    onChange={(values) => {
                      const shouldClosePopover =
                        selectedFieldForOptions.type === "select";
                      addFilterWithOption(
                        selectedFieldForOptions,
                        values as unknown[],
                        shouldClosePopover
                      );
                    }}
                    onClose={() => setAddFilterOpen(false)}
                    inline={true}
                  />
                ) : (
                  <>
                    {showSearchInput && (
                      <CommandInput
                        placeholder={mergedI18n.searchFields}
                        className="h-9"
                      />
                    )}
                    <CommandList>
                      <CommandEmpty>{mergedI18n.noFieldsFound}</CommandEmpty>
                      {fields.map((item, index) => {
                        if (isFieldGroup(item)) {
                          const groupFields = item.fields.filter((field) => {
                            if (field.type === "separator") {
                              return true;
                            }
                            if (allowMultiple) {
                              return true;
                            }
                            return !filters.some(
                              (filter) => filter.field === field.key
                            );
                          });

                          if (groupFields.length === 0) return null;

                          return (
                            <CommandGroup
                              key={`group-${index}`}
                              heading={item.group || "Fields"}
                            >
                              {groupFields.map((field, fieldIndex) => {
                                if (field.type === "separator") {
                                  return (
                                    <CommandSeparator
                                      key={`separator-${fieldIndex}`}
                                    />
                                  );
                                }

                                return (
                                  <CommandItem
                                    key={field.key}
                                    onSelect={() =>
                                      field.key && addFilterHandler(field.key)
                                    }
                                  >
                                    {field.icon}
                                    <span>{field.label}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          );
                        }

                        if (isGroupLevelField(item)) {
                          const groupFields = item.fields!.filter((field) => {
                            if (field.type === "separator") {
                              return true;
                            }
                            if (allowMultiple) {
                              return true;
                            }
                            return !filters.some(
                              (filter) => filter.field === field.key
                            );
                          });

                          if (groupFields.length === 0) return null;

                          return (
                            <CommandGroup
                              key={`group-${index}`}
                              heading={item.group || "Fields"}
                            >
                              {groupFields.map((field, fieldIndex) => {
                                if (field.type === "separator") {
                                  return (
                                    <CommandSeparator
                                      key={`separator-${fieldIndex}`}
                                    />
                                  );
                                }

                                return (
                                  <CommandItem
                                    key={field.key}
                                    onSelect={() =>
                                      field.key && addFilterHandler(field.key)
                                    }
                                  >
                                    {field.icon}
                                    <span>{field.label}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          );
                        }

                        const field = item as FilterFieldConfig<T>;

                        if (field.type === "separator") {
                          return (
                            <CommandSeparator key={`separator-${index}`} />
                          );
                        }

                        return (
                          <CommandItem
                            key={field.key}
                            onSelect={() =>
                              field.key && addFilterHandler(field.key)
                            }
                          >
                            {field.icon}
                            <span>{field.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandList>
                  </>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {filters.map((filter) => {
          const field = fieldsMap[filter.field];
          if (!field) return null;

          return (
            <div
              key={filter.id}
              className={filterItemVariants({ variant })}
              data-slot="filter-item"
            >
              <div
                className={filterFieldLabelVariants({
                  variant: variant,
                  size: size,
                  radius: radius,
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
    </FilterContext.Provider>
  );
}

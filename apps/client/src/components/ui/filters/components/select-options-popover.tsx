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
import { Check } from "lucide-react";
import { useState } from "react";
import { useFilterContext } from "../filter-context";
import type { FilterFieldConfig } from "../filter-types";
import { filterFieldValueVariants } from "../filter-variants";

interface SelectOptionsPopoverProps<T = unknown> {
  field: FilterFieldConfig<T>;
  values: T[];
  onChange: (values: T[]) => void;
  onClose?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  inline?: boolean;
}

export function SelectOptionsPopover<T = unknown>({
  field,
  values,
  onChange,
  onClose,
  inline = false,
}: SelectOptionsPopoverProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const context = useFilterContext();

  const isMultiSelect = field.type === "multiselect" || values.length > 1;
  const effectiveValues =
    (field.value !== undefined ? (field.value as T[]) : values) || [];
  const selectedOptions =
    field.options?.filter((opt) => effectiveValues.includes(opt.value)) || [];
  const unselectedOptions =
    field.options?.filter((opt) => !effectiveValues.includes(opt.value)) || [];

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (inline) {
    return (
      <div className="w-full">
        <Command>
          {field.searchable !== false && (
            <CommandInput
              placeholder={context.i18n.placeholders.searchField(
                field.label || ""
              )}
              className="h-8.5 text-sm"
              value={searchInput}
              onValueChange={setSearchInput}
            />
          )}
          <CommandList>
            <CommandEmpty>{context.i18n.noResultsFound}</CommandEmpty>

            {selectedOptions.length > 0 && (
              <CommandGroup heading={field.label || "Selected"}>
                {selectedOptions.map((option) => (
                  <CommandItem
                    key={String(option.value)}
                    className="group flex gap-2 items-center"
                    onSelect={() => {
                      if (isMultiSelect) {
                        const next = effectiveValues.filter(
                          (v) => v !== option.value
                        ) as T[];
                        if (field.onValueChange) {
                          field.onValueChange(next);
                        } else {
                          onChange(next);
                        }
                      } else {
                        if (field.onValueChange) {
                          field.onValueChange([] as T[]);
                        } else {
                          onChange([] as T[]);
                        }
                      }
                    }}
                  >
                    {option.icon && option.icon}
                    <span className="text-accent-foreground truncate">
                      {option.label}
                    </span>
                    <Check className="text-primary ms-auto" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {unselectedOptions.length > 0 && (
              <>
                {selectedOptions.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  {unselectedOptions.map((option) => (
                    <CommandItem
                      key={String(option.value)}
                      className="group flex gap-2 items-center"
                      value={option.label}
                      onSelect={() => {
                        if (isMultiSelect) {
                          const newValues = [
                            ...effectiveValues,
                            option.value,
                          ] as T[];
                          if (
                            field.maxSelections &&
                            newValues.length > field.maxSelections
                          ) {
                            return;
                          }
                          if (field.onValueChange) {
                            field.onValueChange(newValues);
                          } else {
                            onChange(newValues);
                          }
                        } else {
                          if (field.onValueChange) {
                            field.onValueChange([option.value] as T[]);
                          } else {
                            onChange([option.value] as T[]);
                          }
                          onClose?.();
                        }
                      }}
                    >
                      {option.icon && option.icon}
                      <span className="text-accent-foreground truncate">
                        {option.label}
                      </span>
                      <Check className="text-primary ms-auto opacity-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </div>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setTimeout(() => setSearchInput(""), 200);
        }
      }}
    >
      <PopoverTrigger
        className={filterFieldValueVariants({
          variant: context.variant,
          size: context.size,
          cursorPointer: context.cursorPointer,
        })}
      >
        <div className="flex gap-1.5 items-center">
          {field.customValueRenderer ? (
            field.customValueRenderer(values, field.options || [])
          ) : (
            <>
              {selectedOptions.length > 0 && (
                <div
                  className={cn(
                    "-space-x-1.5 flex items-center",
                    field.selectedOptionsClassName
                  )}
                >
                  {selectedOptions.slice(0, 3).map((option) => (
                    <div key={String(option.value)}>{option.icon}</div>
                  ))}
                </div>
              )}
              {selectedOptions.length === 1
                ? selectedOptions[0].label
                : selectedOptions.length > 1
                ? `${selectedOptions.length} ${context.i18n.selectedCount}`
                : context.i18n.select}
            </>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-[200px] p-0", field.className)}
      >
        <Command>
          {field.searchable !== false && (
            <CommandInput
              placeholder={context.i18n.placeholders.searchField(
                field.label || ""
              )}
              className="h-9 text-sm"
              value={searchInput}
              onValueChange={setSearchInput}
            />
          )}
          <CommandList>
            <CommandEmpty>{context.i18n.noResultsFound}</CommandEmpty>

            {selectedOptions.length > 0 && (
              <CommandGroup>
                {selectedOptions.map((option) => (
                  <CommandItem
                    key={String(option.value)}
                    className="group flex gap-2 items-center"
                    onSelect={() => {
                      if (isMultiSelect) {
                        onChange(
                          values.filter((v) => v !== option.value) as T[]
                        );
                      } else {
                        onChange([] as T[]);
                      }
                      if (!isMultiSelect) {
                        setOpen(false);
                        handleClose();
                      }
                    }}
                  >
                    {option.icon && option.icon}
                    <span className="text-accent-foreground truncate">
                      {option.label}
                    </span>
                    <Check className="text-primary ms-auto" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {unselectedOptions.length > 0 && (
              <>
                {selectedOptions.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  {unselectedOptions.map((option) => (
                    <CommandItem
                      key={String(option.value)}
                      className="group flex gap-2 items-center"
                      value={option.label}
                      onSelect={() => {
                        if (isMultiSelect) {
                          const newValues = [...values, option.value] as T[];
                          if (
                            field.maxSelections &&
                            newValues.length > field.maxSelections
                          ) {
                            return;
                          }
                          onChange(newValues);
                        } else {
                          onChange([option.value] as T[]);
                          setOpen(false);
                          handleClose();
                        }
                      }}
                    >
                      {option.icon && option.icon}
                      <span className="text-accent-foreground truncate">
                        {option.label}
                      </span>
                      <Check className="text-primary ms-auto opacity-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

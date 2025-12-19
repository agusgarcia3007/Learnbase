import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@learnbase/ui";
import { Button, ButtonArrow } from "@learnbase/ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@learnbase/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@learnbase/ui";
import { ScrollArea } from "@learnbase/ui";
import { useGetInstructors } from "@/services/instructors";

interface InstructorComboboxProps {
  value?: string | null;
  onChange: (instructorId: string | null) => void;
  disabled?: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function InstructorCombobox({
  value,
  onChange,
  disabled = false,
}: InstructorComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetInstructors({
    limit: 100,
    search: search || undefined,
  });

  const instructors = data?.instructors ?? [];
  const selectedInstructor = instructors.find((i) => i.id === value);

  const handleSelect = useCallback(
    (instructorId: string) => {
      onChange(instructorId === value ? null : instructorId);
      setOpen(false);
      setSearch("");
    },
    [onChange, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          placeholder={!value}
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedInstructor ? (
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={selectedInstructor.avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(selectedInstructor.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedInstructor.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {t("courses.form.instructorPlaceholder")}
            </span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("courses.form.searchInstructor")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <ScrollArea className="max-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : instructors.length === 0 ? (
                <CommandEmpty>{t("courses.form.noInstructors")}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {instructors.map((instructor) => (
                    <CommandItem
                      key={instructor.id}
                      value={instructor.id}
                      onSelect={handleSelect}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={instructor.avatar ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(instructor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{instructor.name}</span>
                      </div>
                      {value === instructor.id && (
                        <Check className="ml-auto size-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

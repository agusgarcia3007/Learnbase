import { useCallback, useRef, useState } from "react";
import type { Course } from "@/services/courses/service";

export type SelectedCourse = {
  id: string;
  title: string;
  level: Course["level"];
  modulesCount: number;
};

type UseCourseMintonOptions = {
  onSelect: (course: SelectedCourse) => void;
  maxMentions?: number;
  selectedCourseIds?: string[];
};

type UseCourseMintonReturn = {
  isOpen: boolean;
  searchQuery: string;
  handleInputChange: (value: string) => void;
  handleSelect: (course: Course) => void;
  close: () => void;
  getCleanedInput: (value: string) => string;
};

export function useCourseMention({
  onSelect,
  maxMentions = 3,
  selectedCourseIds = [],
}: UseCourseMintonOptions): UseCourseMintonReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const triggerIndexRef = useRef<number>(-1);

  const handleInputChange = useCallback(
    (value: string) => {
      const cursorPos = value.length;
      const textBeforeCursor = value.slice(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const charBefore = atIndex > 0 ? value[atIndex - 1] : " ";
        const isStartOfWord = charBefore === " " || charBefore === "\n" || atIndex === 0;

        if (isStartOfWord) {
          const query = textBeforeCursor.slice(atIndex + 1);
          if (!query.includes(" ") && !query.includes("\n")) {
            if (selectedCourseIds.length >= maxMentions) {
              setIsOpen(false);
              return;
            }
            setIsOpen(true);
            setSearchQuery(query);
            triggerIndexRef.current = atIndex;
            return;
          }
        }
      }

      setIsOpen(false);
      setSearchQuery("");
    },
    [maxMentions, selectedCourseIds.length]
  );

  const handleSelect = useCallback(
    (course: Course) => {
      if (selectedCourseIds.includes(course.id)) {
        setIsOpen(false);
        setSearchQuery("");
        return;
      }

      onSelect({
        id: course.id,
        title: course.title,
        level: course.level,
        modulesCount: course.modulesCount,
      });

      setIsOpen(false);
      setSearchQuery("");
    },
    [onSelect, selectedCourseIds]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const getCleanedInput = useCallback(
    (value: string): string => {
      if (triggerIndexRef.current === -1) return value;

      const before = value.slice(0, triggerIndexRef.current);
      const after = value.slice(triggerIndexRef.current);
      const cleaned = after.replace(/^@\S*\s?/, "");

      triggerIndexRef.current = -1;
      return before + cleaned;
    },
    []
  );

  return {
    isOpen,
    searchQuery,
    handleInputChange,
    handleSelect,
    close,
    getCleanedInput,
  };
}

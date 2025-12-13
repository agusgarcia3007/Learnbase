import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CourseMentionPopover } from "./course-mention-popover";
import { useGetCourses } from "@/services/courses";
import { cn } from "@/lib/utils";

export type MentionedCourse = {
  id: string;
  title: string;
};

export type InlineMentionInputHandle = {
  focus: () => void;
  clear: () => void;
  getData: () => { text: string; courses: MentionedCourse[] };
};

type Props = {
  placeholder?: string;
  disabled?: boolean;
  maxMentions?: number;
  className?: string;
  onSubmit?: (data: { text: string; courses: MentionedCourse[] }) => void;
};

export const InlineMentionInput = forwardRef<InlineMentionInputHandle, Props>(
  ({ placeholder, disabled = false, maxMentions = 3, className, onSubmit }, ref) => {
    const { t } = useTranslation();
    const editorRef = useRef<HTMLDivElement>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const triggerRangeRef = useRef<Range | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const getCurrentCourseIds = useCallback((): string[] => {
      if (!editorRef.current) return [];
      const chips = editorRef.current.querySelectorAll("[data-course-id]");
      return Array.from(chips).map((el) => el.getAttribute("data-course-id")!);
    }, []);

    const excludeIds = getCurrentCourseIds();

    const { data: coursesData } = useGetCourses(
      { search: searchQuery || undefined, limit: 10 },
      { enabled: isPopoverOpen }
    );

    const filteredCourses = useMemo(
      () => (coursesData?.courses ?? []).filter((c) => !excludeIds.includes(c.id)),
      [coursesData?.courses, excludeIds]
    );

    const getData = useCallback((): { text: string; courses: MentionedCourse[] } => {
      if (!editorRef.current) return { text: "", courses: [] };

      const chips = editorRef.current.querySelectorAll("[data-course-id]");
      const courses = Array.from(chips).map((el) => ({
        id: el.getAttribute("data-course-id")!,
        title: el.getAttribute("data-course-title")!,
      }));

      const clone = editorRef.current.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("[data-course-id]").forEach((el) => el.remove());
      const text = clone.textContent?.trim() || "";

      return { text, courses };
    }, []);

    const clear = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
        setIsEmpty(true);
      }
    }, []);

    const focus = useCallback(() => {
      editorRef.current?.focus();
    }, []);

    useImperativeHandle(ref, () => ({
      focus,
      clear,
      getData,
    }));

    const closePopover = useCallback(() => {
      setIsPopoverOpen(false);
      setSearchQuery("");
      setSelectedIndex(0);
      triggerRangeRef.current = null;
    }, []);

    const detectMention = useCallback(() => {
      const sel = window.getSelection();
      if (!sel?.rangeCount || !editorRef.current) return;

      const range = sel.getRangeAt(0);
      if (!editorRef.current.contains(range.startContainer)) return;

      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) {
        closePopover();
        return;
      }

      const text = node.textContent || "";
      const offset = range.startOffset;

      let atIndex = -1;
      for (let i = offset - 1; i >= 0; i--) {
        if (text[i] === "@") {
          const charBefore = i > 0 ? text[i - 1] : " ";
          if (charBefore === " " || charBefore === "\n" || i === 0 || charBefore === "\u00A0") {
            atIndex = i;
            break;
          }
        }
        if (text[i] === " " || text[i] === "\n" || text[i] === "\u00A0") {
          break;
        }
      }

      if (atIndex !== -1) {
        const query = text.slice(atIndex + 1, offset);
        if (!query.includes(" ") && !query.includes("\n")) {
          const currentIds = getCurrentCourseIds();
          if (currentIds.length >= maxMentions) {
            closePopover();
            return;
          }

          const triggerRange = document.createRange();
          triggerRange.setStart(node, atIndex);
          triggerRange.setEnd(node, offset);
          triggerRangeRef.current = triggerRange;

          setSearchQuery(query);
          setIsPopoverOpen(true);
          setSelectedIndex(0);
          return;
        }
      }

      closePopover();
    }, [closePopover, getCurrentCourseIds, maxMentions]);

    const insertChip = useCallback(
      (course: { id: string; title: string }) => {
        if (!triggerRangeRef.current || !editorRef.current) return;

        const chip = document.createElement("span");
        chip.contentEditable = "false";
        chip.className =
          "inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-xs font-medium text-primary align-middle select-none";
        chip.setAttribute("data-course-id", course.id);
        chip.setAttribute("data-course-title", course.title);

        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "size-3");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-width", "2");
        icon.setAttribute("stroke-linecap", "round");
        icon.setAttribute("stroke-linejoin", "round");
        icon.innerHTML = '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>';

        const titleSpan = document.createElement("span");
        titleSpan.className = "max-w-[100px] truncate";
        titleSpan.textContent = course.title;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "opacity-60 hover:opacity-100 ml-0.5";
        removeBtn.innerHTML =
          '<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
        removeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          chip.remove();
          editorRef.current?.focus();
        };

        chip.appendChild(icon);
        chip.appendChild(titleSpan);
        chip.appendChild(removeBtn);

        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(triggerRangeRef.current);

        triggerRangeRef.current.deleteContents();
        triggerRangeRef.current.insertNode(chip);

        const space = document.createTextNode("\u00A0");
        chip.after(space);

        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(newRange);

        closePopover();
        editorRef.current?.focus();
        setIsEmpty(false);
      },
      [closePopover]
    );

    const handleInput = useCallback(() => {
      detectMention();
      const hasContent = editorRef.current?.textContent?.trim() || editorRef.current?.querySelector("[data-course-id]");
      setIsEmpty(!hasContent);
    }, [detectMention]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          if (isPopoverOpen && filteredCourses.length > 0) {
            e.preventDefault();
            const course = filteredCourses[selectedIndex % filteredCourses.length];
            if (course) {
              insertChip({ id: course.id, title: course.title });
            }
            return;
          }

          if (!isPopoverOpen) {
            e.preventDefault();
            const data = getData();
            if (data.text || data.courses.length > 0) {
              onSubmit?.(data);
            }
            return;
          }
        }

        if (!isPopoverOpen) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCourses.length));
          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCourses.length) % Math.max(1, filteredCourses.length));
          return;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          closePopover();
          return;
        }
      },
      [isPopoverOpen, closePopover, getData, onSubmit, filteredCourses, selectedIndex, insertChip]
    );

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }, []);

    const handleSelect = useCallback(
      (course: { id: string; title: string; level: string; modulesCount: number }) => {
        insertChip({ id: course.id, title: course.title });
      },
      [insertChip]
    );

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const handleBackspace = (e: KeyboardEvent) => {
        if (e.key !== "Backspace") return;

        const sel = window.getSelection();
        if (!sel?.rangeCount) return;

        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;

        const node = range.startContainer;
        const offset = range.startOffset;

        if (node === editor && offset > 0) {
          const prevNode = editor.childNodes[offset - 1];
          if (prevNode instanceof HTMLElement && prevNode.hasAttribute("data-course-id")) {
            e.preventDefault();
            prevNode.remove();
          }
        } else if (node.nodeType === Node.TEXT_NODE && offset === 0) {
          const prevSibling = node.previousSibling;
          if (prevSibling instanceof HTMLElement && prevSibling.hasAttribute("data-course-id")) {
            e.preventDefault();
            prevSibling.remove();
          }
        }
      };

      editor.addEventListener("keydown", handleBackspace);
      return () => editor.removeEventListener("keydown", handleBackspace);
    }, []);

    return (
      <div className={cn("relative", className)}>
        {isPopoverOpen && (
          <CourseMentionPopover
            open={isPopoverOpen}
            searchQuery={searchQuery}
            onSelect={handleSelect}
            excludeIds={getCurrentCourseIds()}
            selectedIndex={selectedIndex}
          />
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          suppressContentEditableWarning
          className={cn(
            "min-h-10 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none",
            "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            isEmpty && "before:content-[attr(data-placeholder)] before:text-muted-foreground before:pointer-events-none"
          )}
          data-placeholder={placeholder}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        />
      </div>
    );
  }
);

InlineMentionInput.displayName = "InlineMentionInput";

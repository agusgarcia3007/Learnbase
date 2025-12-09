import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CheckCircle,
  FileText,
  GraduationCap,
  Layers,
  PlayCircle,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CoursePreview } from "@/hooks/use-ai-course-chat";

type CoursePreviewCardProps = {
  preview: CoursePreview;
  onConfirm: () => void;
  onEdit: () => void;
};

const LEVEL_COLORS = {
  beginner: "primary",
  intermediate: "secondary",
  advanced: "success",
} as const;

const ITEM_ICONS = {
  video: PlayCircle,
  document: FileText,
  quiz: BookOpen,
} as const;

export function CoursePreviewCard({
  preview,
  onConfirm,
  onEdit,
}: CoursePreviewCardProps) {
  const { t } = useTranslation();

  const totalItems = preview.modules.reduce(
    (acc, module) => acc + module.items.length,
    0
  );

  return (
    <Card className="w-full overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("courses.aiCreator.preview.label")}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-tight">
              {preview.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {preview.shortDescription}
            </p>
          </div>
          <Badge
            variant={LEVEL_COLORS[preview.level]}
            appearance="light"
            size="sm"
          >
            {t(`courses.levels.${preview.level}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="size-4" />
            <span>
              {preview.modules.length} {t("courses.preview.modules")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="size-4" />
            <span>
              {totalItems} {t("courses.preview.items")}
            </span>
          </div>
        </div>

        {preview.objectives.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Target className="size-4 text-primary" />
              {t("courses.form.objectives")}
            </div>
            <ul className="space-y-1">
              {preview.objectives.slice(0, 3).map((objective, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                  <span>{objective}</span>
                </li>
              ))}
              {preview.objectives.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{preview.objectives.length - 3} {t("common.more")}
                </li>
              )}
            </ul>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium">
            {t("courses.preview.curriculum")}
          </div>
          <ScrollArea className="h-32">
            <div className="space-y-3 pr-4">
              {preview.modules.map((module, moduleIndex) => (
                <div key={module.id || moduleIndex} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {moduleIndex + 1}
                    </span>
                    <span className="text-sm font-medium">{module.title}</span>
                  </div>
                  <ul className="ml-7 space-y-0.5">
                    {module.items.slice(0, 3).map((item, itemIndex) => {
                      const Icon = ITEM_ICONS[item.type];
                      return (
                        <li
                          key={item.id || itemIndex}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <Icon className="size-3" />
                          <span className="truncate">{item.title}</span>
                        </li>
                      );
                    })}
                    {module.items.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{module.items.length - 3} {t("common.more")}
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t bg-muted/30 pt-4">
        <Button variant="outline" onClick={onEdit} className="flex-1">
          {t("courses.aiCreator.preview.edit")}
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          {t("courses.aiCreator.preview.confirm")}
        </Button>
      </CardFooter>
    </Card>
  );
}

import { useTranslation } from "react-i18next";
import { useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  type DragEndEvent,
} from "@/components/kibo-ui/kanban";
import { FeatureCard } from "./feature-card";
import type { Feature, FeatureStatus } from "@/services/features";

type KanbanColumn = {
  id: string;
  name: string;
};

type KanbanFeature = Feature & {
  name: string;
  column: string;
};

interface FeatureKanbanProps {
  features: {
    ideas: Feature[];
    inProgress: Feature[];
    shipped: Feature[];
  };
  onVote: (id: string, value: 1 | -1) => void;
  onCardClick?: (feature: Feature) => void;
  onStatusChange?: (id: string, status: FeatureStatus) => void;
  canDrag?: boolean;
  canVote?: boolean;
}

export function FeatureKanban({
  features,
  onVote,
  onCardClick,
  onStatusChange,
  canDrag = false,
  canVote = true,
}: FeatureKanbanProps) {
  const { t } = useTranslation();

  const columns: KanbanColumn[] = [
    { id: "ideas", name: t("features.columns.ideas") },
    { id: "in_progress", name: t("features.columns.inProgress") },
    { id: "shipped", name: t("features.columns.shipped") },
  ];

  const data: KanbanFeature[] = [
    ...features.ideas.map((f) => ({ ...f, name: f.title, column: "ideas" })),
    ...features.inProgress.map((f) => ({
      ...f,
      name: f.title,
      column: "in_progress",
    })),
    ...features.shipped.map((f) => ({ ...f, name: f.title, column: "shipped" })),
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onStatusChange) return;

    const { active, over } = event;
    if (!over) return;

    const activeFeature = data.find((f) => f.id === active.id);
    if (!activeFeature) return;

    const overColumn = columns.find((c) => c.id === over.id);
    const overFeature = data.find((f) => f.id === over.id);
    const newStatus = overColumn?.id ?? overFeature?.column;

    if (newStatus && newStatus !== activeFeature.column) {
      onStatusChange(activeFeature.id, newStatus as FeatureStatus);
    }
  };

  return (
    <KanbanProvider
      columns={columns}
      data={data}
      onDragEnd={handleDragEnd}
      sensors={canDrag ? sensors : []}
    >
      {(column) => (
        <KanbanBoard key={column.id} id={column.id}>
          <KanbanHeader className="flex items-center justify-between">
            <span>{column.name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
              {data.filter((f) => f.column === column.id).length}
            </span>
          </KanbanHeader>
          <KanbanCards<KanbanFeature> id={column.id}>
            {(feature) => (
              <KanbanCard
                key={feature.id}
                id={feature.id}
                name={feature.name}
                column={feature.column}
              >
                <FeatureCard
                  feature={feature}
                  onVote={onVote}
                  onClick={() => onCardClick?.(feature)}
                  canVote={canVote}
                />
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}

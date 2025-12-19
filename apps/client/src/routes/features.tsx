import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus, Clock, ArrowLeft } from "lucide-react";

import { Button } from "@learnbase/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Header } from "@/components/header";
import {
  FeatureKanban,
  FeatureSubmitDialog,
  FeatureCreateDialog,
  FeatureDetailDialog,
  FeatureApprovalDialog,
  PendingFeaturesPanel,
} from "@/components/features";
import { createSeoMeta } from "@/lib/seo";
import { useGetProfile } from "@/services/profile/queries";
import {
  useFeaturesBoard,
  useFeaturesPending,
  useSubmitFeature,
  useCreateFeatureDirect,
  useVoteFeature,
  useUpdateFeatureStatus,
  useApproveFeature,
  useRejectFeature,
  type Feature,
  type FeatureStatus,
  type SubmitFeatureRequest,
  type CreateFeatureDirectRequest,
} from "@/services/features";

export const Route = createFileRoute("/features")({
  ssr: false,
  head: () =>
    createSeoMeta({
      title: "Roadmap | LearnBase",
      description:
        "See what we're building next. Vote on features and submit your ideas.",
      noindex: false,
    }),
  component: FeaturesPage,
});

function FeaturesSkeleton() {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-4">
      {[1, 2, 3].map((col) => (
        <div key={col} className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="space-y-2 rounded-md border bg-secondary p-2">
            {[1, 2, 3].map((card) => (
              <Skeleton key={card} className="h-28 w-full rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturesPage() {
  const { t } = useTranslation();

  const { data: profileData } = useGetProfile();
  const { data: boardData, isLoading: isBoardLoading } = useFeaturesBoard();
  const { data: pendingData, isLoading: isPendingLoading } =
    useFeaturesPending();

  const { mutate: submitFeature, isPending: isSubmitting } = useSubmitFeature();
  const { mutate: createDirect, isPending: isCreating } =
    useCreateFeatureDirect();
  const { mutate: voteFeature } = useVoteFeature();
  const { mutate: updateStatus } = useUpdateFeatureStatus();
  const { mutate: approveFeature, isPending: isApproving } =
    useApproveFeature();
  const { mutate: rejectFeature, isPending: isRejecting } = useRejectFeature();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailFeature, setDetailFeature] = useState<Feature | null>(null);
  const [approvalFeature, setApprovalFeature] = useState<Feature | null>(null);

  const user = profileData?.user;
  const isSuperadmin = user?.role === "superadmin";
  const isAuthenticated = !!user;

  const features = boardData?.features ?? {
    ideas: [],
    inProgress: [],
    shipped: [],
  };
  const pendingFeatures = pendingData?.features ?? [];

  const handleSubmit = (data: SubmitFeatureRequest) => {
    submitFeature(data, {
      onSuccess: () => setSubmitDialogOpen(false),
    });
  };

  const handleCreateDirect = (data: CreateFeatureDirectRequest) => {
    createDirect(data, {
      onSuccess: () => setCreateDialogOpen(false),
    });
  };

  const handleVote = (id: string, value: 1 | -1) => {
    if (!isAuthenticated) return;
    voteFeature({ id, value });
  };

  const handleStatusChange = (id: string, status: FeatureStatus) => {
    if (!isSuperadmin) return;
    updateStatus({ id, status });
  };

  const handleApprove = (id: string) => {
    approveFeature(id, {
      onSuccess: () => setApprovalFeature(null),
    });
  };

  const handleReject = (id: string, reason?: string) => {
    rejectFeature(
      { id, reason },
      {
        onSuccess: () => setApprovalFeature(null),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-2xl">{t("features.title")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("features.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {isSuperadmin && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Clock className="mr-2 size-4" />
                    {t("features.pending.title")}
                    {pendingFeatures.length > 0 && (
                      <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
                        {pendingFeatures.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t("features.pending.title")}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <PendingFeaturesPanel
                      features={pendingFeatures}
                      onApprove={setApprovalFeature}
                      onReject={setApprovalFeature}
                      isLoading={isPendingLoading}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {isSuperadmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                {t("features.create.button")}
              </Button>
            )}

            {isAuthenticated && !isSuperadmin && (
              <Button size="sm" onClick={() => setSubmitDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                {t("features.submit.button")}
              </Button>
            )}

            {!isAuthenticated && (
              <Link to="/__auth/login">
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  {t("features.submit.button")}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isBoardLoading ? (
          <FeaturesSkeleton />
        ) : (
          <FeatureKanban
            features={features}
            onVote={handleVote}
            onCardClick={setDetailFeature}
            onStatusChange={handleStatusChange}
            canDrag={isSuperadmin}
            canVote={isAuthenticated}
          />
        )}
      </main>

      <FeatureSubmitDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        onSubmit={handleSubmit}
        isPending={isSubmitting}
      />

      <FeatureCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateDirect}
        isPending={isCreating}
      />

      <FeatureDetailDialog
        feature={detailFeature}
        open={!!detailFeature}
        onOpenChange={(open) => !open && setDetailFeature(null)}
        onVote={handleVote}
        canVote={isAuthenticated}
      />

      <FeatureApprovalDialog
        feature={approvalFeature}
        open={!!approvalFeature}
        onOpenChange={(open) => !open && setApprovalFeature(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />
    </div>
  );
}

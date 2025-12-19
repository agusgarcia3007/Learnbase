import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";
import { Button } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import { RelatedCoursesSection } from "./related-courses-section";
import { CertificateCard } from "@/components/certificate/certificate-card";
import { useCertificate } from "@/services/certificates";

type CourseCompletedViewProps = {
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
  };
  enrollmentId: string;
  onReviewCourse: () => void;
};

export function CourseCompletedView({
  course,
  enrollmentId,
  onReviewCourse,
}: CourseCompletedViewProps) {
  const { t } = useTranslation();
  const { data: certificateData, isLoading: certificateLoading } =
    useCertificate(enrollmentId);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="size-10 text-primary" />
          </div>

          <h1 className="mb-3 text-3xl font-bold">{t("learn.congratulations")}</h1>

          <p className="mb-8 text-lg text-muted-foreground">
            {t("learn.courseCompleted", { title: course.title })}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/my-courses">{t("learn.backToMyCourses")}</Link>
            </Button>
            <Button onClick={onReviewCourse}>{t("learn.reviewCourse")}</Button>
          </div>
        </div>

        {certificateLoading ? (
          <div className="mb-12">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : certificateData?.certificate ? (
          <div className="mb-12">
            <CertificateCard certificate={certificateData.certificate} />
          </div>
        ) : null}

        <RelatedCoursesSection courseSlug={course.slug} />
      </div>
    </div>
  );
}

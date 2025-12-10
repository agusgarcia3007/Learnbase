import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useEnroll, useEnrollmentCheck } from "@/services/enrollments";

type EnrollButtonProps = {
  courseId: string;
  courseSlug: string;
  isFree: boolean;
};

export function EnrollButton({ courseId, courseSlug, isFree }: EnrollButtonProps) {
  const { t } = useTranslation();
  const isAuthenticated =
    typeof window !== "undefined" && !!localStorage.getItem("accessToken");

  const { data: enrollmentData, isLoading: isChecking } = useEnrollmentCheck(
    isAuthenticated ? courseId : ""
  );
  const { mutate: enroll, isPending: isEnrolling } = useEnroll();

  const isEnrolled = enrollmentData?.isEnrolled ?? false;

  if (!isAuthenticated) {
    return (
      <Link to="/login">
        <Button size="lg" className="w-full font-semibold">
          {isFree
            ? t("campus.courseDetail.enrollFree")
            : t("campus.courseDetail.buyNow")}
        </Button>
      </Link>
    );
  }

  if (isEnrolled) {
    return (
      <Link
        to="/my-courses/$courseSlug"
        params={{ courseSlug }}
        search={{}}
      >
        <Button size="lg" className="w-full font-semibold">
          {t("enrollments.continueLearning")}
        </Button>
      </Link>
    );
  }

  const handleEnroll = () => {
    enroll(courseId);
  };

  return (
    <Button
      size="lg"
      className="w-full font-semibold"
      onClick={handleEnroll}
      isLoading={isChecking || isEnrolling}
    >
      {isFree
        ? t("campus.courseDetail.enrollFree")
        : t("campus.courseDetail.buyNow")}
    </Button>
  );
}

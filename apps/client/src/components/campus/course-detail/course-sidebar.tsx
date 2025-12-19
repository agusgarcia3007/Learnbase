import { useState } from "react";
import {
  Check,
  FileText,
  Heart,
  Infinity as InfinityIcon,
  Layers,
  Play,
  Share2,
  ShoppingCart,
  Smartphone,
  Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@learnbase/ui";
import { Card, CardContent } from "@learnbase/ui";
import { Image } from "@learnbase/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@learnbase/ui";
import { Link } from "@tanstack/react-router";
import { formatPrice, getInitials } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { EnrollButton } from "@/components/campus/enroll-button";
import { useEnrollmentCheck } from "@/services/enrollments";
import type { CampusCourseDetail } from "@/services/campus/service";

type CourseSidebarProps = {
  course: CampusCourseDetail;
};

export function CourseSidebar({ course }: CourseSidebarProps) {
  const { t } = useTranslation();
  const { addToCart, removeFromCart, isInCart, isPending, isAuthenticated, buyNow, isCheckingOut } = useCart();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { data: enrollmentData } = useEnrollmentCheck(
    isAuthenticated ? course.id : ""
  );
  const isEnrolled = enrollmentData?.isEnrolled ?? false;

  const hasDiscount = course.originalPrice && course.originalPrice > course.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / course.originalPrice!) * 100)
    : 0;

  const isFree = course.price === 0;
  const priceText = formatPrice(course.price, course.currency) ?? t("campus.course.free");
  const inCart = isInCart(course.id);
  const hasPreviewVideo = !!course.previewVideoUrl;

  const handleCartClick = () => {
    if (inCart) {
      removeFromCart(course.id);
    } else {
      addToCart(course.id);
    }
  };

  const handleThumbnailClick = () => {
    if (hasPreviewVideo) {
      setIsVideoModalOpen(true);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-border/50 shadow-xl">
        <div
          className={`relative aspect-video ${hasPreviewVideo ? "cursor-pointer" : ""} group`}
          onClick={handleThumbnailClick}
        >
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              layout="fullWidth"
              aspectRatio={16 / 9}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              {hasPreviewVideo && <Play className="size-16 text-muted-foreground" />}
            </div>
          )}
          {hasPreviewVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 transition-opacity group-hover:bg-black/70">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-transparent transition-transform group-hover:scale-110">
                <Play className="size-7 fill-white text-white" />
              </div>
              <span className="mt-3 text-sm font-medium text-white">{t("campus.courseDetail.previewCourse")}</span>
            </div>
          )}
        </div>

      <CardContent className="p-5">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {priceText}
          </span>
          {hasDiscount && (
            <>
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(course.originalPrice!, course.currency)}
              </span>
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t("campus.courseDetail.discount", { percent: discountPercent })}
              </span>
            </>
          )}
        </div>

        {hasDiscount && (
          <p className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="font-medium">{t("campus.courseDetail.offerEndsSoon")}</span>
          </p>
        )}

        <div className="space-y-2.5">
          {isFree || isEnrolled ? (
            <EnrollButton
              courseId={course.id}
              courseSlug={course.slug}
              isFree={isFree}
            />
          ) : isAuthenticated ? (
            <>
              <Button
                size="lg"
                className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={() => buyNow(course.id)}
                isLoading={isCheckingOut}
              >
                {t("cart.buyNow")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full font-semibold"
                onClick={handleCartClick}
                isLoading={isPending}
              >
                <ShoppingCart className="mr-2 size-4" />
                {inCart ? t("cart.removeFromCart") : t("cart.addToCart")}
              </Button>
            </>
          ) : (
            <Link to="/login" className="w-full">
              <Button size="lg" className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                <ShoppingCart className="mr-2 size-4" />
                {t("cart.loginToAdd")}
              </Button>
            </Link>
          )}
        </div>

        <p className="my-4 text-center text-xs text-muted-foreground">
          {t("campus.courseDetail.moneyBackGuarantee")}
        </p>

        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold">{t("campus.courseDetail.includes")}</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Play className="size-4 shrink-0" />
              <span>{t("campus.courseDetail.videoLessons", { count: course.itemsCount })}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Layers className="size-4 shrink-0" />
              <span>{t("campus.courseDetail.contentModules", { count: course.modulesCount })}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <FileText className="size-4 shrink-0" />
              <span>{t("campus.courseDetail.downloadableResources")}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <InfinityIcon className="size-4 shrink-0" />
              <span>{t("campus.courseDetail.lifetimeAccess")}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Smartphone className="size-4 shrink-0" />
              <span>{t("campus.courseDetail.mobileAccess")}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Trophy className="size-4 shrink-0" />
              <span>{t("campus.courseDetail.certificate")}</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 border-t pt-4">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Share2 className="size-4" />
            <span>{t("campus.courseDetail.share")}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Heart className="size-4" />
            <span>{t("campus.courseDetail.favorite")}</span>
          </button>
        </div>
      </CardContent>
    </Card>

      {/* Video Preview Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{t("campus.courseDetail.previewCourse")}</DialogTitle>
          <video
            src={course.previewVideoUrl ?? undefined}
            controls
            autoPlay
            className="w-full aspect-video"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CourseRequirements({ requirements }: { requirements: string[] }) {
  const { t } = useTranslation();

  if (!requirements.length) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">{t("campus.courseDetail.requirements")}</h2>
      <ul className="space-y-2.5">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground" />
            <span className="text-[15px]">{req}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CourseObjectives({ objectives }: { objectives: string[] }) {
  const { t } = useTranslation();

  if (!objectives.length) return null;

  return (
    <div className="rounded-lg border border-border p-6">
      <h2 className="mb-5 text-xl font-bold">{t("campus.courseDetail.whatYouWillLearn")}</h2>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {objectives.map((obj, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-primary" />
            <span className="text-[15px]">{obj}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseInstructor({ course }: { course: CampusCourseDetail }) {
  const { t } = useTranslation();

  if (!course.instructor) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">{t("campus.course.instructor")}</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 border-2 border-background">
            <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(course.instructor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 pt-2">
            <h3 className="text-lg font-bold text-primary underline">{course.instructor.name}</h3>
            {course.instructor.title && (
              <p className="text-muted-foreground">{course.instructor.title}</p>
            )}
          </div>
        </div>
        {course.instructor.bio && (
          <p className="leading-relaxed text-muted-foreground">{course.instructor.bio}</p>
        )}
      </div>
    </div>
  );
}

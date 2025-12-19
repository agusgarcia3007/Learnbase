import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import { Label } from "@learnbase/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@learnbase/ui";
import { useGetTenantUsers } from "@/services/users";
import { useGetCourses } from "@/services/courses";

type EnrollDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { userId: string; courseId: string }) => void;
  isPending?: boolean;
};

export function EnrollDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: EnrollDialogProps) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");

  const { data: usersData, isLoading: usersLoading } = useGetTenantUsers({
    limit: 100,
  });

  const { data: coursesData, isLoading: coursesLoading } = useGetCourses({
    limit: 100,
    status: "published",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !courseId) return;
    onSubmit({ userId, courseId });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setUserId("");
      setCourseId("");
    }
    onOpenChange(open);
  };

  const users = usersData?.users ?? [];
  const courses = coursesData?.courses ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dashboard.enrollments.enroll.title")}</DialogTitle>
          <DialogDescription>
            {t("dashboard.enrollments.enroll.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">
              {t("dashboard.enrollments.enroll.selectUser")}
            </Label>
            <Select
              value={userId}
              onValueChange={setUserId}
              disabled={isPending || usersLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("dashboard.enrollments.enroll.selectUser")}
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">
              {t("dashboard.enrollments.enroll.selectCourse")}
            </Label>
            <Select
              value={courseId}
              onValueChange={setCourseId}
              disabled={isPending || coursesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("dashboard.enrollments.enroll.selectCourse")}
                />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              isLoading={isPending}
              disabled={!userId || !courseId}
            >
              {t("dashboard.enrollments.enroll.button")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

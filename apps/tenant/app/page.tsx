import { getTenant } from "@/lib/tenant";
import { fetchCourses } from "@/lib/api";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Courses } from "@/components/landing/courses";
import { Footer } from "@/components/landing/footer";

export default async function Page() {
  const tenant = await getTenant();

  if (!tenant) {
    notFound();
  }

  const courses = await fetchCourses(tenant.slug, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header tenant={tenant} />
      <main className="flex-1">
        <Hero tenant={tenant} />
        <Courses courses={courses} />
      </main>
      <Footer tenant={tenant} />
    </div>
  );
}

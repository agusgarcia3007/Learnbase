import { createFileRoute } from "@tanstack/react-router";
import Markdown from "react-markdown";
import { LandingHeader } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";
import { createSeoMeta } from "@/lib/seo";
import changelogContent from "../../../../CHANGELOG.md?raw";

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
  head: () =>
    createSeoMeta({
      title: "Changelog | Learnbase",
      description: "See what's new in Learnbase - latest features, improvements, and bug fixes.",
    }),
});

function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Markdown>{changelogContent}</Markdown>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

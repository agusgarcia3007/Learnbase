import { Skeleton } from "@/components/ui/skeleton";

export function LearnSkeleton() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="h-5 w-px" />
        <Skeleton className="h-4 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-80 flex-col border-r lg:flex">
          <div className="border-b p-4">
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          <div className="flex-1 space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-12" />
                <div className="space-y-1 pl-2 pt-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3 py-2">
                      <Skeleton className="size-8 rounded-md" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-2.5 w-12" />
                      </div>
                      <Skeleton className="size-4 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 lg:px-8">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

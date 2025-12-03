import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { Toaster } from "./components/ui/sonner";
import "./i18n";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { catchAxiosError } from "./lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
    mutations: {
      onError: catchAxiosError,
    },
  },
});

// Set up a Router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    isCampus: false,
    tenantSlug: null,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 0,
  defaultPendingMinMs: 0,
  scrollRestoration: true,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

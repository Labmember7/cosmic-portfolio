import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

import type { ErrorComponentProps } from "@tanstack/react-router";

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bacem Zarai — A Cosmic Journey | Robotics & Embedded Systems Engineer" },
      {
        name: "description",
        content:
          "Explore the 3D cosmic journey of Bacem Zarai — robotics, embedded systems, firmware, and computer vision engineer. Journey through career milestones, the interstellar rift, and autonomous perception projects.",
      },
      { name: "keywords", content: "Bacem Zarai, Robotics Engineer, Embedded Systems, Computer Vision, Autonomous Systems, ROS 2, C++, 3D Space Portfolio, Interactive Portfolio" },
      { name: "author", content: "Bacem Zarai" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:title", content: "Bacem Zarai — A Cosmic Journey | Robotics & Embedded Systems Engineer" },
      {
        property: "og:description",
        content:
          "An interactive 3D space odyssey showcasing robotics engineering milestones, autonomous perception, and embedded systems projects.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Bacem Zarai Portfolio" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Bacem Zarai — A Cosmic Journey | Robotics & Embedded Systems Engineer" },
      {
        name: "twitter:description",
        content:
          "An interactive 3D space odyssey showcasing robotics engineering milestones, autonomous perception, and embedded systems projects.",
      },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/046badd7-8389-48d4-a060-c7c95e31df2a/id-preview-f3517df3--298b3062-03f9-4e7c-bb2a-6fb505753e52.lovable.app-1779668646759.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/046badd7-8389-48d4-a060-c7c95e31df2a/id-preview-f3517df3--298b3062-03f9-4e7c-bb2a-6fb505753e52.lovable.app-1779668646759.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800;900&family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="crt-screen">
        {children}
        <CrtOverlay />
        <Scripts />
      </body>
    </html>
  );
}

function CrtOverlay() {
  return (
    <div className="crt-root" aria-hidden="true">
      <div className="crt-chroma" />
      <div className="crt-mask" />
      <div className="crt-scanlines" />
      <div className="crt-roll" />
      <div className="crt-noise" />
      <div className="crt-vignette" />
      <div className="crt-power" />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

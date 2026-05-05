// Supports weights 100-900
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Databuddy } from "@databuddy/sdk/react";
import appCss from "../styles.css?url";
import { cn } from "@/lib/utils";

const isDevelopment = import.meta.env.DEV;

// Supports weights 100-900
export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Memento Mori - Visualize Your Life in Weeks",
      },
      {
        name: "description",
        content: "Memento Mori: Visualize your entire life in weeks. Reflect on mortality, plan your time, and align daily choices with your values. See how much time you've lived and what remains.",
      },
      {
        name: "keywords",
        content: "memento mori, mortality visualizer, life expectancy, weeks calculator, life visualization, time management, mortality awareness",
      },
      {
        name: "author",
        content: "aashuu",
      },
      {
        name: "creator",
        content: "@warrioraashuu",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:title",
        content: "Memento Mori - Visualize Your Life in Weeks",
      },
      {
        property: "og:description",
        content: "Visualize your entire life in weeks. Understand mortality, reflect on time usage, and make intentional life choices based on your life expectancy.",
      },
      {
        property: "og:image",
        content: "https://memento-mori.aashuu.tech/preview.png",
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:url",
        content: "https://memento-mori.aashuu.tech/",
      },
      {
        property: "og:site_name",
        content: "Memento Mori",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:creator",
        content: "@warrioraashuu",
      },
      {
        name: "twitter:title",
        content: "Memento Mori - Visualize Your Life in Weeks",
      },
      {
        name: "twitter:description",
        content: "See your entire life in weeks. Understand mortality and make intentional choices about how you spend your time.",
      },
      {
        name: "twitter:image",
        content: "https://memento-mori.aashuu.tech/preview.png",
      },
      {
        name: "theme-color",
        content: "#000000",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      {
        httpEquiv: "x-ua-compatible",
        content: "IE=edge",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://memento-mori.aashuu.tech/",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Memento Mori",
    description: "Visualize your entire life in weeks. Reflect on mortality and make intentional life choices.",
    url: "https://memento-mori.aashuu.tech/",
    creator: {
      "@type": "Person",
      name: "aashuu",
      url: "https://x.com/warrioraashuu",
      sameAs: [
        "https://x.com/warrioraashuu",
      ],
    },
    image: "https://memento-mori.aashuu.tech/preview.png",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <HeadContent />
      </head>
      <body className={cn("antialiased bg-terminal-black ")}>
        {children}

        <Databuddy clientId="rhQX-ll5oxETW6wwdxhqa" enableBatching={true} />
        {isDevelopment ? (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}

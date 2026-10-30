import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import html from "@/content/pages/privacy.html?raw";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PUPUK Academy" },
      { name: "description", content: "How PUPUK Academy collects, uses and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — PUPUK Academy" },
      { property: "og:description", content: "How PUPUK Academy collects, uses and protects your personal information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage title="Privacy Policy" html={html} />,
});

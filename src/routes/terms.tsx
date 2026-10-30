import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import html from "@/content/pages/terms.html?raw";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — PUPUK Academy" },
      { name: "description", content: "The terms for using PUPUK Academy, its tutor marketplace and memberships." },
      { property: "og:title", content: "Terms & Conditions — PUPUK Academy" },
      { property: "og:description", content: "The terms for using PUPUK Academy, its tutor marketplace and memberships." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage title="Terms & Conditions" html={html} />,
});

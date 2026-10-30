import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import html from "@/content/pages/refund.html?raw";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — PUPUK Academy" },
      { name: "description", content: "Refunds and cancellations for PUPUK Academy memberships and services." },
      { property: "og:title", content: "Refund & Cancellation Policy — PUPUK Academy" },
      { property: "og:description", content: "Refunds and cancellations for PUPUK Academy memberships and services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage title="Refund & Cancellation Policy" html={html} />,
});

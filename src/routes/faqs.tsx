import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import html from "@/content/pages/faqs.html?raw";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — PUPUK Academy" },
      { name: "description", content: "Answers about tutors, tutor fees, learning materials and the RM20/month membership." },
      { property: "og:title", content: "FAQs — PUPUK Academy" },
      { property: "og:description", content: "Answers about tutors, tutor fees, learning materials and the RM20/month membership." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage title="Frequently Asked Questions" html={html} />,
});

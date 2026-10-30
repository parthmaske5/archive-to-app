import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import html from "@/content/pages/about.html?raw";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About PUPUK Academy — PUPUK Academy" },
      { name: "description", content: "How PUPUK Academy connects students, parents and independent tutors with learning materials." },
      { property: "og:title", content: "About PUPUK Academy — PUPUK Academy" },
      { property: "og:description", content: "How PUPUK Academy connects students, parents and independent tutors with learning materials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage title="About Us" html={html} />,
});

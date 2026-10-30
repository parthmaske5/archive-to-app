import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import html from "@/content/pages/contact.html?raw";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact PUPUK Academy — PUPUK Academy" },
      { name: "description", content: "Get help with tutors, learning materials, memberships and partnerships. Email pupukeducation@gmail.com." },
      { property: "og:title", content: "Contact PUPUK Academy — PUPUK Academy" },
      { property: "og:description", content: "Get help with tutors, learning materials, memberships and partnerships. Email pupukeducation@gmail.com." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage title="Contact Us" html={html} />,
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/site/AuthForm";

export const Route = createFileRoute("/auth/student")({
  head: () => ({
    meta: [
      { title: "Student Sign In — PUPUK Academy" },
      { name: "description", content: "Sign in or create a student account on PUPUK Academy to find tutors and learning materials." },
      { property: "og:title", content: "Student Sign In — PUPUK Academy" },
      { property: "og:description", content: "Sign in or create a student account on PUPUK Academy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentAuthPage,
});

function StudentAuthPage() {
  return <AuthForm role="student" />;
}

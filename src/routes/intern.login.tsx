import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/intern/login")({
  beforeLoad: () => { throw redirect({ to: "/auth", search: { role: "intern" }, replace: true }); },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Intern Login – Task Manager" },
      { name: "description", content: "Login to view and manage your assigned tasks." },
      { property: "og:title", content: "Intern Login – Task Manager" },
      { property: "og:description", content: "Login to view and manage your assigned tasks." },
    ],
  }),
});

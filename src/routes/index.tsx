import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Task Manager – Admin Panel" },
      { name: "description", content: "Create, assign and track team tasks from one admin dashboard." },
      { property: "og:title", content: "Task Manager – Admin Panel" },
      { property: "og:description", content: "Create, assign and track team tasks from one admin dashboard." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

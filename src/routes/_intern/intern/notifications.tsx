import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/bits";
import { NotificationList } from "@/components/app/NotificationBell";

export const Route = createFileRoute("/_intern/intern/notifications")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Notifications – Intern Portal" },
      { name: "description", content: "New assignments, comments and deadline reminders." },
      { property: "og:title", content: "Notifications – Intern Portal" },
      { property: "og:description", content: "New assignments, comments and deadline reminders." },
    ],
  }),
  component: () => (
    <div className="max-w-3xl">
      <PageHeader title="Notifications" subtitle="New assignments, admin comments and deadline reminders." />
      <div className="card-soft overflow-hidden"><NotificationList /></div>
    </div>
  ),
});

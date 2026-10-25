import { createFileRoute } from "@tanstack/react-router";
import { MembersPage } from "@/components/app/MembersPage";
export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [
    { title: "Interns – Task Manager" },
    { name: "description", content: "Manage intern records, accounts and workload in one directory." },
    { property: "og:title", content: "Interns – Task Manager" },
    { property: "og:description", content: "Manage intern records, accounts and workload in one directory." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: MembersPage,
});

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/interns")({
  beforeLoad: () => {
    throw redirect({ to: "/team" });
  },
});
